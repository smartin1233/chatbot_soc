"""API for managing business units, LOBs, and weekly metrics."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime, timedelta
import databutton as db
import asyncpg

router = APIRouter(prefix="/business-data")

# ============================================================================
# Pydantic Models
# ============================================================================

class BusinessUnitCreate(BaseModel):
    name: str = Field(..., description="Name of the business unit")
    description: Optional[str] = Field(None, description="Description of the business unit")

class BusinessUnitResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

class LOBCreate(BaseModel):
    business_unit_id: int = Field(..., description="ID of the parent business unit")
    name: str = Field(..., description="Name of the LOB (e.g., Phone, Chat)")
    description: Optional[str] = Field(None, description="Description of the LOB")

class LOBResponse(BaseModel):
    id: int
    business_unit_id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

class WeeklyMetricCreate(BaseModel):
    lob_id: int = Field(..., description="ID of the LOB")
    week_date: date = Field(..., description="Sunday date for the week")
    metric_name: str = Field(..., description="Name of the metric (e.g., orders, resolution_time)")
    metric_value: float = Field(..., description="Value of the metric")

class WeeklyMetricResponse(BaseModel):
    id: int
    lob_id: int
    week_date: date
    metric_name: str
    metric_value: float
    created_at: datetime

class WeeklyMetricBulkCreate(BaseModel):
    metrics: List[WeeklyMetricCreate]

# ============================================================================
# Database Connection Helper
# ============================================================================

async def get_db_connection():
    """Get database connection."""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

# ============================================================================
# Business Unit Endpoints
# ============================================================================

@router.post("/business-units", response_model=BusinessUnitResponse)
async def create_business_unit(unit: BusinessUnitCreate):
    """Create a new business unit."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO business_units (name, description)
            VALUES ($1, $2)
            RETURNING id, name, description, created_at, updated_at
            """,
            unit.name, unit.description
        )
        return dict(row)
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Business unit with this name already exists")
    finally:
        await conn.close()

@router.get("/business-units", response_model=List[BusinessUnitResponse])
async def list_business_units():
    """List all business units."""
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            "SELECT id, name, description, created_at, updated_at FROM business_units ORDER BY name"
        )
        return [dict(row) for row in rows]
    finally:
        await conn.close()

@router.get("/business-units/{unit_id}", response_model=BusinessUnitResponse)
async def get_business_unit(unit_id: int):
    """Get a specific business unit by ID."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id, name, description, created_at, updated_at FROM business_units WHERE id = $1",
            unit_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Business unit not found")
        return dict(row)
    finally:
        await conn.close()

@router.delete("/business-units/{unit_id}")
async def delete_business_unit(unit_id: int):
    """Delete a business unit."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM business_units WHERE id = $1",
            unit_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Business unit not found")
        return {"message": "Business unit deleted successfully"}
    finally:
        await conn.close()

# ============================================================================
# LOB Endpoints
# ============================================================================

@router.post("/lobs", response_model=LOBResponse)
async def create_lob(lob: LOBCreate):
    """Create a new Line of Business (LOB)."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO lobs (business_unit_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING id, business_unit_id, name, description, created_at, updated_at
            """,
            lob.business_unit_id, lob.name, lob.description
        )
        return dict(row)
    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Business unit not found")
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="LOB with this name already exists for this business unit")
    finally:
        await conn.close()

@router.get("/lobs", response_model=List[LOBResponse])
async def list_lobs(business_unit_id: Optional[int] = None):
    """List all LOBs, optionally filtered by business unit."""
    conn = await get_db_connection()
    try:
        if business_unit_id:
            rows = await conn.fetch(
                """
                SELECT id, business_unit_id, name, description, created_at, updated_at 
                FROM lobs 
                WHERE business_unit_id = $1
                ORDER BY name
                """,
                business_unit_id
            )
        else:
            rows = await conn.fetch(
                "SELECT id, business_unit_id, name, description, created_at, updated_at FROM lobs ORDER BY name"
            )
        return [dict(row) for row in rows]
    finally:
        await conn.close()

@router.get("/lobs/{lob_id}", response_model=LOBResponse)
async def get_lob(lob_id: int):
    """Get a specific LOB by ID."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id, business_unit_id, name, description, created_at, updated_at FROM lobs WHERE id = $1",
            lob_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="LOB not found")
        return dict(row)
    finally:
        await conn.close()

@router.delete("/lobs/{lob_id}")
async def delete_lob(lob_id: int):
    """Delete a LOB."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM lobs WHERE id = $1",
            lob_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="LOB not found")
        return {"message": "LOB deleted successfully"}
    finally:
        await conn.close()

# ============================================================================
# Weekly Metrics Endpoints
# ============================================================================

@router.post("/weekly-metrics", response_model=WeeklyMetricResponse)
async def create_weekly_metric(metric: WeeklyMetricCreate):
    """Create a single weekly metric."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO weekly_metrics (lob_id, week_date, metric_name, metric_value)
            VALUES ($1, $2, $3, $4)
            RETURNING id, lob_id, week_date, metric_name, metric_value, created_at
            """,
            metric.lob_id, metric.week_date, metric.metric_name, metric.metric_value
        )
        return dict(row)
    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="LOB not found")
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Metric already exists for this LOB, week, and metric name")
    finally:
        await conn.close()

@router.post("/weekly-metrics/bulk")
async def create_weekly_metrics_bulk(data: WeeklyMetricBulkCreate):
    """Create multiple weekly metrics in bulk."""
    conn = await get_db_connection()
    try:
        # Use a transaction for bulk insert
        async with conn.transaction():
            inserted_count = 0
            for metric in data.metrics:
                try:
                    await conn.execute(
                        """
                        INSERT INTO weekly_metrics (lob_id, week_date, metric_name, metric_value)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (lob_id, week_date, metric_name) DO NOTHING
                        """,
                        metric.lob_id, metric.week_date, metric.metric_name, metric.metric_value
                    )
                    inserted_count += 1
                except Exception as e:
                    print(f"Error inserting metric: {e}")
                    continue
        
        return {"message": f"Successfully inserted {inserted_count} metrics"}
    finally:
        await conn.close()

@router.get("/weekly-metrics", response_model=List[WeeklyMetricResponse])
async def list_weekly_metrics(
    lob_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metric_name: Optional[str] = None
):
    """List weekly metrics with optional filters."""
    conn = await get_db_connection()
    try:
        query = "SELECT id, lob_id, week_date, metric_name, metric_value, created_at FROM weekly_metrics WHERE 1=1"
        params = []
        param_count = 0
        
        if lob_id:
            param_count += 1
            query += f" AND lob_id = ${param_count}"
            params.append(lob_id)
        
        if start_date:
            param_count += 1
            query += f" AND week_date >= ${param_count}"
            params.append(start_date)
        
        if end_date:
            param_count += 1
            query += f" AND week_date <= ${param_count}"
            params.append(end_date)
        
        if metric_name:
            param_count += 1
            query += f" AND metric_name = ${param_count}"
            params.append(metric_name)
        
        query += " ORDER BY week_date DESC, metric_name"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]
    finally:
        await conn.close()

@router.get("/weekly-metrics/{metric_id}", response_model=WeeklyMetricResponse)
async def get_weekly_metric(metric_id: int):
    """Get a specific weekly metric by ID."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id, lob_id, week_date, metric_name, metric_value, created_at FROM weekly_metrics WHERE id = $1",
            metric_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Metric not found")
        return dict(row)
    finally:
        await conn.close()

@router.delete("/weekly-metrics/{metric_id}")
async def delete_weekly_metric(metric_id: int):
    """Delete a weekly metric."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM weekly_metrics WHERE id = $1",
            metric_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Metric not found")
        return {"message": "Metric deleted successfully"}
    finally:
        await conn.close()

# ============================================================================
# Helper Endpoint: Generate Dummy Data
# ============================================================================

@router.post("/generate-dummy-data")
async def generate_dummy_data(weeks: int = 12):
    """Generate dummy weekly metrics for Phone and Chat LOBs."""
    import random
    from datetime import timedelta
    
    conn = await get_db_connection()
    try:
        # Get LOBs
        lobs = await conn.fetch("SELECT id, name FROM lobs")
        if not lobs:
            raise HTTPException(status_code=400, detail="No LOBs found. Please create business units and LOBs first.")
        
        # Generate data for the last N weeks (Sundays)
        today = datetime.now().date()
        # Find the most recent Sunday
        days_since_sunday = (today.weekday() + 1) % 7
        last_sunday = today - timedelta(days=days_since_sunday)
        
        metrics_to_insert = []
        
        for week_offset in range(weeks):
            week_date = last_sunday - timedelta(weeks=week_offset)
            
            for lob in lobs:
                lob_id = lob['id']
                lob_name = lob['name']
                
                # Generate different metrics based on LOB
                base_orders = 1000 if lob_name == 'Phone' else 1500
                base_resolution_time = 15 if lob_name == 'Phone' else 8
                
                metrics_to_insert.append({
                    'lob_id': lob_id,
                    'week_date': week_date,
                    'metric_name': 'orders',
                    'metric_value': base_orders + random.randint(-200, 300)
                })
                
                metrics_to_insert.append({
                    'lob_id': lob_id,
                    'week_date': week_date,
                    'metric_name': 'avg_resolution_time_min',
                    'metric_value': round(base_resolution_time + random.uniform(-3, 5), 2)
                })
                
                metrics_to_insert.append({
                    'lob_id': lob_id,
                    'week_date': week_date,
                    'metric_name': 'customer_satisfaction',
                    'metric_value': round(random.uniform(3.5, 5.0), 2)
                })
                
                metrics_to_insert.append({
                    'lob_id': lob_id,
                    'week_date': week_date,
                    'metric_name': 'revenue',
                    'metric_value': round((base_orders + random.randint(-200, 300)) * random.uniform(45, 75), 2)
                })
        
        # Insert all metrics
        async with conn.transaction():
            for metric in metrics_to_insert:
                await conn.execute(
                    """
                    INSERT INTO weekly_metrics (lob_id, week_date, metric_name, metric_value)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (lob_id, week_date, metric_name) DO UPDATE 
                    SET metric_value = EXCLUDED.metric_value
                    """,
                    metric['lob_id'], metric['week_date'], metric['metric_name'], metric['metric_value']
                )
        
        return {
            "message": f"Successfully generated {len(metrics_to_insert)} dummy metrics for {weeks} weeks",
            "weeks_generated": weeks,
            "lobs_count": len(lobs)
        }
    finally:
        await conn.close()
