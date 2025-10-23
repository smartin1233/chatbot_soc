"""LangGraph workflow orchestration for Insight Co-Pilot agents.

This module uses LangGraph's StateGraph to orchestrate agent selection and execution
with conditional routing, state persistence, and error recovery.
"""

from typing import TypedDict, Annotated, Sequence, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import operator
from openai import OpenAI
import databutton as db
import json
import re

from app.libs.agents import (
    get_agent,
    list_all_agents,
    AGENT_REGISTRY
)


# ============================================================================
# STATE DEFINITION
# ============================================================================

class AgentState(TypedDict):
    """State that flows through the agent workflow."""
    # User input
    user_query: str
    session_id: str
    
    # Conversation context
    messages: Annotated[Sequence[dict], operator.add]
    
    # Agent routing
    selected_agent: str
    agent_params: dict
    
    # Agent results
    agent_response: dict
    
    # Final output
    final_response: str
    
    # Error handling
    error: str | None


# ============================================================================
# WORKFLOW NODES
# ============================================================================

class AgentWorkflow:
    """Main workflow orchestrator using LangGraph."""
    
    def __init__(self, api_key: str = None, model: str = None):
        # Use provided API key or fall back to default
        openai_key = api_key or db.secrets.get("OPENAI_API_KEY")
        self.openai_client = OpenAI(api_key=openai_key)
        self.model = model or "gpt-4o-mini"
        self.memory = MemorySaver()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph StateGraph."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("classify_intent", self.classify_intent)
        workflow.add_node("route_to_agent", self.route_to_agent)
        workflow.add_node("execute_agent", self.execute_agent)
        workflow.add_node("generate_response", self.generate_response)
        workflow.add_node("handle_error", self.handle_error)
        
        # Set entry point
        workflow.set_entry_point("classify_intent")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "classify_intent",
            self.should_route_to_agent,
            {
                "route": "route_to_agent",
                "direct": "generate_response",
                "error": "handle_error"
            }
        )
        
        workflow.add_edge("route_to_agent", "execute_agent")
        
        workflow.add_conditional_edges(
            "execute_agent",
            self.check_execution_result,
            {
                "success": "generate_response",
                "error": "handle_error"
            }
        )
        
        workflow.add_edge("generate_response", END)
        workflow.add_edge("handle_error", END)
        
        return workflow.compile(checkpointer=self.memory)
    
    # ========================================================================
    # NODE FUNCTIONS
    # ========================================================================
    
    async def classify_intent(self, state: AgentState) -> AgentState:
        """Classify user intent to determine which agent to use."""
        user_query = state["user_query"].lower()
        
        # Simple rule-based classification for common patterns
        # This is more reliable than pure LLM classification and prevents hallucinations
        selected_agent = "none"
        params = {}
        reasoning = ""
        
        # Data fetching patterns
        if any(word in user_query for word in ["show", "list", "get", "fetch", "what data", "available", "datasets"]):
            selected_agent = "data_fetcher"
            params = {"query_type": "datasets"}
            reasoning = "User wants to view available data"
            
            if "business unit" in user_query:
                params["query_type"] = "business_units"
            elif "metric" in user_query:
                params["query_type"] = "metrics"
        
        # Comparison and analysis patterns
        elif any(word in user_query for word in ["compare", "comparison", "versus", "vs", "difference between"]):
            selected_agent = "comparison_analyzer"
            params = {"comparison_type": "lob_comparison"}
            reasoning = "User wants to compare metrics"
        
        # Forecasting patterns
        elif any(word in user_query for word in ["forecast", "predict", "projection", "future", "next quarter", "next year"]):
            selected_agent = "model_trainer"
            params = {"model_type": "prophet"}
            reasoning = "User wants forecasting"
        
        # Trend analysis patterns
        elif any(word in user_query for word in ["trend", "pattern", "insight", "analyze"]):
            selected_agent = "insights_analyzer"
            params = {"analysis_type": "trend_analysis"}
            reasoning = "User wants trend analysis"
        
        # Scenario modeling patterns
        elif any(word in user_query for word in ["what if", "scenario", "simulate", "impact", "growth rate"]):
            selected_agent = "scenario_modeler"
            params = {"scenario_type": "growth_projection"}
            reasoning = "User wants scenario modeling"
        
        # Data exploration patterns
        elif any(word in user_query for word in ["explore", "statistics", "summary", "describe", "profile"]):
            selected_agent = "data_explorer"
            params = {}
            reasoning = "User wants data exploration"
        
        # Visualization patterns - add explicit detection
        elif any(word in user_query for word in ["visualize", "plot", "chart", "graph", "show me a"]):
            selected_agent = "visualizer"
            # Determine chart type based on keywords
            if "line" in user_query or "time" in user_query:
                params = {"viz_type": "line_chart", "data": [], "title": "Time Series"}
            elif "bar" in user_query or "compare" in user_query:
                params = {"viz_type": "bar_chart", "data": [], "title": "Comparison"}
            else:
                params = {"viz_type": "line_chart", "data": [], "title": "Data Visualization"}
            reasoning = "User wants data visualization"
        
        # Create/manage patterns
        elif any(word in user_query for word in ["create", "add", "new", "delete", "remove", "update"]):
            selected_agent = "crud_manager"
            params = {"operation": "list"}  # Default to list, more specific parsing could be added
            reasoning = "User wants to manage entities"
        
        print(f"[Intent Classification] {reasoning} -> Agent: {selected_agent}")
        
        state["selected_agent"] = selected_agent
        state["agent_params"] = params
        state["messages"] = [{"role": "system", "content": f"Intent classified: {reasoning}"}]
        
        return state
    
    def should_route_to_agent(self, state: AgentState) -> Literal["route", "direct", "error"]:
        """Decide if query should be routed to an agent."""
        if state.get("error"):
            return "error"
        
        selected_agent = state.get("selected_agent", "none")
        
        if selected_agent == "none" or selected_agent not in AGENT_REGISTRY:
            return "direct"
        
        return "route"
    
    async def route_to_agent(self, state: AgentState) -> AgentState:
        """Prepare parameters for agent execution."""
        # Additional routing logic or parameter preparation can go here
        state["messages"] = state.get("messages", []) + [
            {"role": "system", "content": f"Routing to {state['selected_agent']} agent"}
        ]
        return state
    
    async def execute_agent(self, state: AgentState) -> AgentState:
        """Execute the selected agent."""
        agent_name = state["selected_agent"]
        params = state["agent_params"]
        
        try:
            agent = get_agent(agent_name)
            if not agent:
                state["error"] = f"Agent {agent_name} not found"
                return state
            
            # Execute agent
            result = await agent.execute(params)
            state["agent_response"] = result
            
            state["messages"] = state.get("messages", []) + [
                {"role": "system", "content": f"Agent {agent_name} executed successfully"}
            ]
            
        except Exception as e:
            state["error"] = f"Agent execution failed: {str(e)}"
        
        return state
    
    def check_execution_result(self, state: AgentState) -> Literal["success", "error"]:
        """Check if agent execution was successful."""
        if state.get("error"):
            return "error"
        
        agent_response = state.get("agent_response", {})
        if agent_response.get("error"):
            state["error"] = agent_response["error"]
            return "error"
        
        return "success"
    
    async def generate_response(self, state: AgentState) -> AgentState:
        """Generate final response using LLM based on agent results."""
        user_query = state["user_query"]
        agent_response = state.get("agent_response")
        selected_agent = state.get("selected_agent", "none")
        
        # If no agent was used, generate direct response
        if selected_agent == "none" or not agent_response:
            prompt = f"""You are Insight Co-Pilot, a business analytics assistant.

User question: {user_query}

Provide a helpful, conversational response. Explain what capabilities you have:
- Analyze datasets and business metrics
- Generate forecasts and predictions
- Compare business units and LOBs
- Create visualizations and charts
- Run scenario simulations

If you need data, suggest what the user should provide or upload.
"""
        else:
            # Generate response based on agent results
            # Validate agent response structure to prevent hallucinations
            if not isinstance(agent_response, dict):
                state["error"] = "Invalid agent response format"
                return await self.handle_error(state)
            
            agent_data = json.dumps(agent_response, indent=2, default=str)
            prompt = f"""You are Insight Co-Pilot, a business analytics assistant.

User question: {user_query}

The {selected_agent} agent has analyzed the request and provided these results:
{agent_data}

Generate a clear, conversational response that:
1. Directly answers the user's question based ONLY on the provided data
2. Highlights key insights from the agent results
3. Provides actionable recommendations if available in the data
4. Uses business-friendly language (avoid technical jargon)
5. If data is empty or missing, acknowledge it honestly - DO NOT make up data

IMPORTANT: Only use information from the agent results. Do not invent or hallucinate data.

Keep the response concise and focused.
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            
            state["final_response"] = response.choices[0].message.content
            
        except Exception as e:
            state["final_response"] = f"I encountered an error generating the response: {str(e)}"
        
        return state
    
    async def handle_error(self, state: AgentState) -> AgentState:
        """Handle errors gracefully."""
        error_msg = state.get("error", "Unknown error occurred")
        
        state["final_response"] = f"""I apologize, but I encountered an issue: {error_msg}

Please try:
- Rephrasing your question
- Providing more specific details
- Checking if the required data is available

I'm here to help with data analysis, forecasting, and business insights!"""
        
        return state
    
    # ========================================================================
    # PUBLIC API
    # ========================================================================
    
    async def process_query(self, user_query: str, session_id: str, context: dict = None) -> dict:
        """Process a user query through the agent workflow.
        
        Args:
            user_query: The user's question or request
            session_id: Unique session identifier for state persistence
            context: Optional additional context (database info, etc.)
        
        Returns:
            dict with response, agent_used, visualization data, and any additional data
        """
        # Initial state
        initial_state = AgentState(
            user_query=user_query,
            session_id=session_id,
            messages=[],
            selected_agent="",
            agent_params={},
            agent_response={},
            final_response="",
            error=None
        )
        
        # Add context to agent params if provided
        if context:
            initial_state["agent_params"] = context
        
        # Run the workflow
        config = {"configurable": {"thread_id": session_id}}
        
        try:
            final_state = await self.graph.ainvoke(initial_state, config)
            
            # Extract visualization if present
            agent_data = final_state.get("agent_response", {})
            visualization = None
            
            # Check if agent returned visualization data (Plotly chart)
            if isinstance(agent_data, dict) and "chart_config" in agent_data:
                visualization = {
                    "type": agent_data.get("viz_type", "chart"),
                    "config": agent_data.get("chart_config")
                }
            
            return {
                "response": final_state.get("final_response", "No response generated"),
                "agent_used": final_state.get("selected_agent", "none"),
                "agent_data": agent_data,
                "visualization": visualization,
                "success": not final_state.get("error"),
                "error": final_state.get("error")
            }
        
        except Exception as e:
            print(f"[Workflow Error] {str(e)}")
            return {
                "response": f"I encountered an unexpected error: {str(e)}",
                "agent_used": "none",
                "agent_data": None,
                "visualization": None,
                "success": False,
                "error": str(e)
            }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

def get_workflow(api_key: str = None, model: str = None) -> AgentWorkflow:
    """Get or create a workflow instance with custom API configuration.
    
    Args:
        api_key: OpenAI API key (if None, uses default from secrets)
        model: Model name (if None, uses gpt-4o-mini)
    
    Returns:
        AgentWorkflow instance
    """
    # Create new instance with custom configuration
    # Note: In production, you might want to cache instances per user
    return AgentWorkflow(api_key=api_key, model=model)
