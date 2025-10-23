"""User settings API for configuring API keys and models."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import databutton as db
import asyncpg
from openai import OpenAI

router = APIRouter(prefix="/settings")


class UserSettings(BaseModel):
    session_id: str
    openai_api_key: Optional[str] = None
    selected_model: str = "gpt-4o-mini"


class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    selected_model: Optional[str] = None


class ValidateKeyRequest(BaseModel):
    api_key: str


class ValidateKeyResponse(BaseModel):
    valid: bool
    message: str
    available_models: list[str] = []


async def get_db_connection():
    """Get database connection."""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)


@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_api_key(request: ValidateKeyRequest):
    """Validate OpenAI API key and return available models."""
    try:
        client = OpenAI(api_key=request.api_key)
        
        # Try a simple API call to validate
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5
        )
        
        # List of commonly available models
        available_models = [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo"
        ]
        
        return ValidateKeyResponse(
            valid=True,
            message="API key is valid",
            available_models=available_models
        )
    
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower() or "authentication" in error_msg.lower():
            return ValidateKeyResponse(
                valid=False,
                message="Invalid API key"
            )
        else:
            return ValidateKeyResponse(
                valid=False,
                message=f"Validation failed: {error_msg}"
            )


@router.get("/settings/{session_id}", response_model=UserSettings)
async def get_settings(session_id: str):
    """Get user settings for a session."""
    conn = await get_db_connection()
    try:
        settings = await conn.fetchrow(
            "SELECT * FROM user_settings WHERE session_id = $1",
            session_id
        )
        
        if settings:
            # Mask the API key for security (show only last 4 chars)
            api_key = settings['openai_api_key']
            masked_key = None
            if api_key:
                masked_key = f"sk-...{api_key[-4:]}" if len(api_key) > 4 else "sk-..."
            
            return UserSettings(
                session_id=session_id,
                openai_api_key=masked_key,
                selected_model=settings['selected_model']
            )
        else:
            # Return defaults
            return UserSettings(
                session_id=session_id,
                selected_model="gpt-4o-mini"
            )
    
    finally:
        await conn.close()


@router.post("/settings/{session_id}", response_model=UserSettings)
async def update_settings(session_id: str, update: SettingsUpdate):
    """Update user settings."""
    conn = await get_db_connection()
    try:
        # Check if settings exist
        existing = await conn.fetchrow(
            "SELECT * FROM user_settings WHERE session_id = $1",
            session_id
        )
        
        if existing:
            # Update existing settings
            if update.openai_api_key is not None:
                await conn.execute(
                    "UPDATE user_settings SET openai_api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2",
                    update.openai_api_key, session_id
                )
            
            if update.selected_model is not None:
                await conn.execute(
                    "UPDATE user_settings SET selected_model = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2",
                    update.selected_model, session_id
                )
        else:
            # Insert new settings
            await conn.execute(
                """INSERT INTO user_settings (session_id, openai_api_key, selected_model)
                   VALUES ($1, $2, $3)""",
                session_id,
                update.openai_api_key,
                update.selected_model or "gpt-4o-mini"
            )
        
        # Return updated settings (masked)
        updated = await conn.fetchrow(
            "SELECT * FROM user_settings WHERE session_id = $1",
            session_id
        )
        
        api_key = updated['openai_api_key']
        masked_key = None
        if api_key:
            masked_key = f"sk-...{api_key[-4:]}" if len(api_key) > 4 else "sk-..."
        
        return UserSettings(
            session_id=session_id,
            openai_api_key=masked_key,
            selected_model=updated['selected_model']
        )
    
    finally:
        await conn.close()
