"""Conversational AI chat API with context awareness and agent orchestration."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import databutton as db
import asyncpg
import json
import uuid

# Import agent workflow
from app.libs.agent_workflow import get_workflow

router = APIRouter(prefix="/chat")

# ============================================================================
# Pydantic Models
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatSession(BaseModel):
    session_id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessage] = []

class ChatSessionList(BaseModel):
    sessions: List[ChatSession]
    total: int

# ============================================================================
# Database Connection Helper
# ============================================================================

async def get_db_connection():
    """Get database connection."""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

# ============================================================================
# Context Building Functions
# ============================================================================

async def get_context_info() -> str:
    """Gather context about available data for the AI."""
    conn = await get_db_connection()
    context_parts = []
    
    try:
        # Get business units
        business_units = await conn.fetch(
            "SELECT id, name, description FROM business_units ORDER BY name"
        )
        if business_units:
            bu_list = [f"- {row['name']} (ID: {row['id']})" for row in business_units]
            if business_units[0]['description']:
                bu_list = [f"- {row['name']} (ID: {row['id']}, Description: {row['description']})" for row in business_units]
            context_parts.append("Available Business Units:\n" + "\n".join(bu_list))
        
        # Get LOBs
        lobs = await conn.fetch(
            """
            SELECT l.id, l.name, l.business_unit_id, bu.name as bu_name
            FROM lobs l
            JOIN business_units bu ON l.business_unit_id = bu.id
            ORDER BY l.name
            """
        )
        if lobs:
            lob_list = [f"- {row['name']} (ID: {row['id']}, under {row['bu_name']})" for row in lobs]
            context_parts.append("Available Lines of Business (LOBs):\n" + "\n".join(lob_list))
        
        # Get datasets
        datasets = await conn.fetch(
            """
            SELECT d.id, d.name, d.description, d.row_count, d.column_count,
                   d.columns_info, d.uploaded_at,
                   COALESCE(bu.name, l.name) as parent_name
            FROM datasets d
            LEFT JOIN business_units bu ON d.business_unit_id = bu.id
            LEFT JOIN lobs l ON d.lob_id = l.id
            ORDER BY d.uploaded_at DESC
            LIMIT 10
            """
        )
        if datasets:
            ds_list = []
            for row in datasets:
                cols_info = json.loads(row['columns_info']) if row['columns_info'] else {}
                col_names = ', '.join(list(cols_info.keys())[:5])
                if len(cols_info) > 5:
                    col_names += f" (and {len(cols_info) - 5} more)"
                ds_list.append(
                    f"- '{row['name']}' (ID: {row['id']}, {row['row_count']} rows, {row['column_count']} cols)\n" +
                    f"  Columns: {col_names}\n" +
                    f"  Under: {row['parent_name']}"
                )
            context_parts.append("Available Datasets:\n" + "\n".join(ds_list))
        
        # Get weekly metrics summary
        metrics_count = await conn.fetchval(
            "SELECT COUNT(*) FROM weekly_metrics"
        )
        if metrics_count > 0:
            context_parts.append(f"Weekly Metrics: {metrics_count} records available")
        
        if not context_parts:
            return "No business units, LOBs, or datasets have been created yet. The user should start by uploading data or creating business structures."
        
        return "\n\n".join(context_parts)
        
    finally:
        await conn.close()

async def get_user_settings(session_id: str) -> Dict[str, Any]:
    """Get user settings for API configuration."""
    conn = await get_db_connection()
    try:
        settings = await conn.fetchrow(
            "SELECT openai_api_key, selected_model FROM user_settings WHERE session_id = $1",
            session_id
        )
        
        if settings and settings['openai_api_key']:
            return {
                "api_key": settings['openai_api_key'],
                "model": settings['selected_model'] or "gpt-4o-mini"
            }
        
        # Return None if no settings found - workflow will use defaults
        return {"api_key": None, "model": None}
    finally:
        await conn.close()

# ============================================================================
# Chat Management Functions
# ============================================================================

async def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create new one."""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    conn = await get_db_connection()
    try:
        # Check if session exists
        existing = await conn.fetchval(
            "SELECT session_id FROM chat_sessions WHERE session_id = $1",
            session_id
        )
        
        if not existing:
            # Create new session
            await conn.execute(
                "INSERT INTO chat_sessions (session_id, title) VALUES ($1, $2)",
                session_id, "New Conversation"
            )
            print(f"Created new chat session: {session_id}")
        
        return session_id
    finally:
        await conn.close()

async def save_message(session_id: str, role: str, content: str):
    """Save a message to the database."""
    conn = await get_db_connection()
    try:
        await conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
            session_id, role, content
        )
        
        # Update session timestamp
        await conn.execute(
            "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1",
            session_id
        )
    finally:
        await conn.close()

async def get_conversation_history(session_id: str, limit: int = 20) -> List[Dict[str, str]]:
    """Get conversation history for a session."""
    conn = await get_db_connection()
    try:
        messages = await conn.fetch(
            """
            SELECT role, content, created_at
            FROM chat_messages
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            session_id, limit
        )
        
        # Reverse to get chronological order
        return [
            {"role": msg['role'], "content": msg['content']}
            for msg in reversed(messages)
        ]
    finally:
        await conn.close()

# ============================================================================
# Endpoints
# ============================================================================

@router.post("/message", tags=["stream"])
async def chat_message(request: ChatRequest):
    """Send a message and get streaming response with agent orchestration."""
    
    async def generate_response():
        session_id = None
        try:
            # Get or create session
            session_id = await get_or_create_session(request.session_id)
            
            # Send session ID first
            yield f"SESSION_ID:{session_id}\n"
            
            # Save user message
            await save_message(session_id, "user", request.message)
            
            # Get user settings for API configuration
            user_settings = await get_user_settings(session_id)
            
            # Get context info
            context_info = await get_context_info()
            
            # Get workflow with user's API key and model
            workflow = get_workflow(
                api_key=user_settings.get("api_key"),
                model=user_settings.get("model")
            )
            
            print(f"[Chat API] Processing message with model: {user_settings.get('model', 'default')}")
            
            # Process query through agent workflow
            result = await workflow.process_query(
                user_query=request.message,
                session_id=session_id,
                context={"system_context": context_info}
            )
            
            # Get the response
            response_text = result.get("response", "I apologize, but I couldn't generate a response.")
            
            # Check if there's a visualization
            visualization = result.get("visualization")
            if visualization and visualization.get("config"):
                # Append visualization marker
                response_text += "\n\n[PLOTLY_CHART]" + json.dumps(visualization["config"]) + "[/PLOTLY_CHART]"
            
            # Stream the response
            for char in response_text:
                yield char
            
            # Save assistant message
            await save_message(session_id, "assistant", response_text)
            
        except Exception as e:
            error_msg = f"I encountered an error: {str(e)}. Please check your API key in settings if you've configured one."
            print(f"[Chat API Error] {str(e)}")
            yield error_msg
            
            if session_id:
                await save_message(session_id, "assistant", error_msg)
    
    return StreamingResponse(generate_response(), media_type="text/plain")

@router.get("/sessions", response_model=ChatSessionList)
async def list_sessions():
    """List all chat sessions."""
    conn = await get_db_connection()
    try:
        sessions = await conn.fetch(
            """
            SELECT session_id, title, created_at, updated_at
            FROM chat_sessions
            ORDER BY updated_at DESC
            LIMIT 50
            """
        )
        
        result = []
        for session in sessions:
            result.append(ChatSession(
                session_id=session['session_id'],
                title=session['title'],
                created_at=session['created_at'],
                updated_at=session['updated_at']
            ))
        
        return ChatSessionList(sessions=result, total=len(result))
    finally:
        await conn.close()

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_session(session_id: str):
    """Get a specific chat session with messages."""
    conn = await get_db_connection()
    try:
        # Get session
        session = await conn.fetchrow(
            "SELECT session_id, title, created_at, updated_at FROM chat_sessions WHERE session_id = $1",
            session_id
        )
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get messages
        messages = await conn.fetch(
            "SELECT role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at",
            session_id
        )
        
        return ChatSession(
            session_id=session['session_id'],
            title=session['title'],
            created_at=session['created_at'],
            updated_at=session['updated_at'],
            messages=[
                ChatMessage(role=msg['role'], content=msg['content'], created_at=msg['created_at'])
                for msg in messages
            ]
        )
    finally:
        await conn.close()

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM chat_sessions WHERE session_id = $1",
            session_id
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully"}
    finally:
        await conn.close()
