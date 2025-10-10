"""API for uploading datasets and performing statistical analysis."""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import databutton as db
import asyncpg
import pandas as pd
import numpy as np
import io
import json

router = APIRouter(prefix="/data")

# ============================================================================
# Pydantic Models
# ============================================================================

class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    lob_id: Optional[int]
    business_unit_id: Optional[int]
    filename: str
    row_count: int
    column_count: int
    columns_info: Dict[str, Any]
    uploaded_at: datetime

class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int

class ColumnStatistics(BaseModel):
    column_name: str
    data_type: str
    count: int
    missing_count: int
    missing_percentage: float
    unique_count: Optional[int] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    q25: Optional[float] = None
    q75: Optional[float] = None
    top_values: Optional[List[Dict[str, Any]]] = None

class StatisticalProfileResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    total_rows: int
    total_columns: int
    columns: List[ColumnStatistics]
    overall_missing_percentage: float
    numeric_columns_count: int
    categorical_columns_count: int
    datetime_columns_count: int

# ============================================================================
# Database Connection Helper
# ============================================================================

async def get_db_connection():
    """Get database connection."""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

# ============================================================================
# Helper Functions
# ============================================================================

def infer_column_type(series: pd.Series) -> str:
    """Infer the semantic type of a column."""
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    elif pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    elif pd.api.types.is_bool_dtype(series):
        return "boolean"
    else:
        return "categorical"

def safe_json_serialize(obj):
    """Safely serialize objects to JSON, handling numpy types."""
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj):
        return None
    return obj

async def analyze_dataframe(df: pd.DataFrame, dataset_id: int, dataset_name: str) -> StatisticalProfileResponse:
    """Perform comprehensive statistical analysis on a dataframe."""
    column_stats = []
    
    total_cells = len(df) * len(df.columns)
    total_missing = df.isna().sum().sum()
    overall_missing_pct = (total_missing / total_cells * 100) if total_cells > 0 else 0
    
    numeric_cols = 0
    categorical_cols = 0
    datetime_cols = 0
    
    for col in df.columns:
        series = df[col]
        col_type = infer_column_type(series)
        
        # Count column types
        if col_type == "numeric":
            numeric_cols += 1
        elif col_type == "categorical":
            categorical_cols += 1
        elif col_type == "datetime":
            datetime_cols += 1
        
        missing_count = int(series.isna().sum())
        valid_count = len(series) - missing_count
        missing_pct = (missing_count / len(series) * 100) if len(series) > 0 else 0
        
        stat = ColumnStatistics(
            column_name=col,
            data_type=col_type,
            count=valid_count,
            missing_count=missing_count,
            missing_percentage=round(missing_pct, 2),
            unique_count=int(series.nunique())
        )
        
        # Numeric statistics
        if col_type == "numeric" and valid_count > 0:
            stat.mean = safe_json_serialize(series.mean())
            stat.median = safe_json_serialize(series.median())
            stat.std = safe_json_serialize(series.std())
            stat.min = safe_json_serialize(series.min())
            stat.max = safe_json_serialize(series.max())
            stat.q25 = safe_json_serialize(series.quantile(0.25))
            stat.q75 = safe_json_serialize(series.quantile(0.75))
        
        # Categorical statistics - top values
        if col_type in ["categorical", "boolean"] and valid_count > 0:
            top_values = series.value_counts().head(10)
            stat.top_values = [
                {"value": str(val), "count": int(count)}
                for val, count in top_values.items()
            ]
        
        column_stats.append(stat)
    
    return StatisticalProfileResponse(
        dataset_id=dataset_id,
        dataset_name=dataset_name,
        total_rows=len(df),
        total_columns=len(df.columns),
        columns=column_stats,
        overall_missing_percentage=round(overall_missing_pct, 2),
        numeric_columns_count=numeric_cols,
        categorical_columns_count=categorical_cols,
        datetime_columns_count=datetime_cols
    )

# ============================================================================
# Endpoints
# ============================================================================

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    lob_id: Optional[int] = Form(None),
    business_unit_id: Optional[int] = Form(None)
):
    """Upload a CSV dataset and store it in the database."""
    
    # Validate that exactly one parent is specified
    if not ((lob_id is not None) ^ (business_unit_id is not None)):
        raise HTTPException(
            status_code=400,
            detail="Must specify exactly one of lob_id or business_unit_id"
        )
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported"
        )
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        print(f"Processing CSV: {len(df)} rows, {len(df.columns)} columns")
        
        # Prepare column info
        columns_info = {}
        for col in df.columns:
            col_type = infer_column_type(df[col])
            columns_info[col] = {
                "type": col_type,
                "dtype": str(df[col].dtype)
            }
        
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Insert dataset metadata
                dataset_row = await conn.fetchrow(
                    """
                    INSERT INTO datasets (
                        name, description, lob_id, business_unit_id, 
                        filename, row_count, column_count, columns_info
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id, name, description, lob_id, business_unit_id, 
                              filename, row_count, column_count, columns_info, uploaded_at
                    """,
                    name, description, lob_id, business_unit_id,
                    file.filename, len(df), len(df.columns), json.dumps(columns_info)
                )
                
                dataset_id = dataset_row['id']
                
                # Insert data rows in batches
                batch_size = 500
                for i in range(0, len(df), batch_size):
                    batch = df.iloc[i:i+batch_size]
                    
                    # Prepare batch insert
                    values = []
                    for idx, row in batch.iterrows():
                        row_data = row.to_dict()
                        # Convert numpy types to Python types
                        row_data = {k: safe_json_serialize(v) for k, v in row_data.items()}
                        values.append((dataset_id, int(idx), json.dumps(row_data)))
                    
                    # Batch insert
                    await conn.executemany(
                        "INSERT INTO dataset_rows (dataset_id, row_number, data) VALUES ($1, $2, $3)",
                        values
                    )
                    
                    print(f"Inserted batch {i//batch_size + 1}: {len(values)} rows")
                
                print(f"Dataset {dataset_id} uploaded successfully")
                
                return DatasetResponse(
                    id=dataset_row['id'],
                    name=dataset_row['name'],
                    description=dataset_row['description'],
                    lob_id=dataset_row['lob_id'],
                    business_unit_id=dataset_row['business_unit_id'],
                    filename=dataset_row['filename'],
                    row_count=dataset_row['row_count'],
                    column_count=dataset_row['column_count'],
                    columns_info=json.loads(dataset_row['columns_info']),
                    uploaded_at=dataset_row['uploaded_at']
                )
        finally:
            await conn.close()
            
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Failed to parse CSV file")
    except Exception as e:
        print(f"Error uploading dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload dataset: {str(e)}")

@router.get("/datasets", response_model=DatasetListResponse)
async def list_datasets(
    lob_id: Optional[int] = None,
    business_unit_id: Optional[int] = None
):
    """List all uploaded datasets."""
    conn = await get_db_connection()
    try:
        query = """
            SELECT id, name, description, lob_id, business_unit_id, 
                   filename, row_count, column_count, columns_info, uploaded_at
            FROM datasets
            WHERE 1=1
        """
        params = []
        param_count = 0
        
        if lob_id:
            param_count += 1
            query += f" AND lob_id = ${param_count}"
            params.append(lob_id)
        
        if business_unit_id:
            param_count += 1
            query += f" AND business_unit_id = ${param_count}"
            params.append(business_unit_id)
        
        query += " ORDER BY uploaded_at DESC"
        
        rows = await conn.fetch(query, *params)
        
        datasets = [
            DatasetResponse(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                lob_id=row['lob_id'],
                business_unit_id=row['business_unit_id'],
                filename=row['filename'],
                row_count=row['row_count'],
                column_count=row['column_count'],
                columns_info=json.loads(row['columns_info']),
                uploaded_at=row['uploaded_at']
            )
            for row in rows
        ]
        
        return DatasetListResponse(datasets=datasets, total=len(datasets))
    finally:
        await conn.close()

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: int):
    """Get dataset metadata."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            SELECT id, name, description, lob_id, business_unit_id, 
                   filename, row_count, column_count, columns_info, uploaded_at
            FROM datasets
            WHERE id = $1
            """,
            dataset_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        return DatasetResponse(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            lob_id=row['lob_id'],
            business_unit_id=row['business_unit_id'],
            filename=row['filename'],
            row_count=row['row_count'],
            column_count=row['column_count'],
            columns_info=json.loads(row['columns_info']),
            uploaded_at=row['uploaded_at']
        )
    finally:
        await conn.close()

@router.get("/datasets/{dataset_id}/analyze", response_model=StatisticalProfileResponse)
async def analyze_dataset(dataset_id: int):
    """Perform statistical profiling on a dataset (DataExplorer agent functionality)."""
    conn = await get_db_connection()
    try:
        # Get dataset metadata
        dataset_row = await conn.fetchrow(
            "SELECT id, name, row_count FROM datasets WHERE id = $1",
            dataset_id
        )
        
        if not dataset_row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Fetch all data rows
        rows = await conn.fetch(
            "SELECT data FROM dataset_rows WHERE dataset_id = $1 ORDER BY row_number",
            dataset_id
        )
        
        if not rows:
            raise HTTPException(status_code=400, detail="Dataset has no data")
        
        # Convert to DataFrame
        data_list = [json.loads(row['data']) for row in rows]
        df = pd.DataFrame(data_list)
        
        print(f"Analyzing dataset {dataset_id}: {len(df)} rows, {len(df.columns)} columns")
        
        # Perform statistical analysis
        analysis = await analyze_dataframe(df, dataset_id, dataset_row['name'])
        
        return analysis
        
    finally:
        await conn.close()

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: int):
    """Delete a dataset and all its data."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM datasets WHERE id = $1",
            dataset_id
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        return {"message": "Dataset deleted successfully"}
    finally:
        await conn.close()
