
import json
import requests
from typing import Any, Optional
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
import mcp.server.stdio
import asyncio


class ZentereAPIClient:
    """Zentere API client for MCP server"""
    
    def __init__(self, base_url: str = "https://app-api-dev.zentere.com/api/v2"):
        self.base_url = base_url
        self.access_token = None
        self.token_type = "Bearer"
        self.client_id = "kLPrcbXlsHYelbpm5HzKg8ZgDE2rVXRhGyJ0GdqH"
        self.client_secret = "IbqUkvq1hWTuc6jK7X6xGClTLThshJhfU6nf7uYm"
    
    def authenticate(self, username: str, password: str) -> dict:
        """Authenticate and get access token"""
        url = f"{self.base_url}/authentication/oauth2/token"
        
        data = {
            'grant_type': 'password',
            'client_id': self.client_id,
            'username': username,
            'password': password,
            'client_secret': self.client_secret
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data.get('access_token')
        self.token_type = token_data.get('token_type', 'Bearer')
        
        return token_data
    
    def _get_headers(self) -> dict:
        """Get authorization headers"""
        if not self.access_token:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        return {
            'Authorization': f'{self.token_type} {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def search_read(self, model: str, fields: Optional[list] = None,
                    domain: Optional[list] = None, limit: int = 100,
                    offset: int = 0, order: Optional[str] = None) -> list:
        """Search and read records"""
        url = f"{self.base_url}/search_read"
        params = {'model': model}
        
        if fields:
            params['fields'] = json.dumps(fields)
        if domain:
            params['domain'] = json.dumps(domain)
        if limit:
            params['limit'] = limit
        if offset:
            params['offset'] = offset
        if order:
            params['order'] = order
        
        response = requests.post(url, headers=self._get_headers(), params=params)
        response.raise_for_status()
        return response.json()
    
    def create(self, model: str, values: dict) -> int:
        """Create a new record"""
        url = f"{self.base_url}/create"
        params = {'model': model}
        
        response = requests.post(url, headers=self._get_headers(),
                                params=params, json=values)
        response.raise_for_status()
        
        result = response.json()
        return result if isinstance(result, int) else result.get('id')
    
    def write(self, model: str, record_id: int, values: dict) -> bool:
        """Update an existing record"""
        url = f"{self.base_url}/write"
        params = {'model': model}
        payload = {'id': record_id, 'values': values}
        
        response = requests.put(url, headers=self._get_headers(),
                               params=params, json=payload)
        response.raise_for_status()
        return True
    
    def unlink(self, model: str, record_id: int) -> bool:
        """Delete a record"""
        url = f"{self.base_url}/unlink"
        params = {'model': model}
        payload = {'id': record_id}
        
        response = requests.delete(url, headers=self._get_headers(),
                                  params=params, json=payload)
        response.raise_for_status()
        return True
    
    def search_count(self, model: str, domain: Optional[list] = None) -> int:
        """Count records matching a domain"""
        url = f"{self.base_url}/search_count"
        params = {'model': model}
        
        if domain:
            params['domain'] = json.dumps(domain)
        
        response = requests.post(url, headers=self._get_headers(), params=params)
        response.raise_for_status()
        return response.json()


# Initialize the MCP server and API client
app = Server("zentere-api")
api_client = ZentereAPIClient()


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="zentere_authenticate",
            description="Authenticate with Zentere API and get access token",
            inputSchema={
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "Username for authentication"
                    },
                    "password": {
                        "type": "string",
                        "description": "Password for authentication"
                    }
                },
                "required": ["username", "password"]
            }
        ),
        Tool(
            name="zentere_search_read",
            description="Search and read records from Zentere API. Can filter, sort, and paginate results.",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model name (e.g., 'data_feeds', 'forecast_model')"
                    },
                    "fields": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of fields to retrieve (optional)"
                    },
                    "domain": {
                        "type": "array",
                        "description": "Search domain filter (e.g., [['active', '=', True]])"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of records (default: 100)",
                        "default": 100
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Number of records to skip (default: 0)",
                        "default": 0
                    },
                    "order": {
                        "type": "string",
                        "description": "Sort order (e.g., 'name asc', 'date desc')"
                    }
                },
                "required": ["model"]
            }
        ),
        Tool(
            name="zentere_create",
            description="Create a new record in Zentere API",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "values": {
                        "type": "object",
                        "description": "Field values for the new record"
                    }
                },
                "required": ["model", "values"]
            }
        ),
        Tool(
            name="zentere_write",
            description="Update an existing record in Zentere API",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "record_id": {
                        "type": "integer",
                        "description": "ID of the record to update"
                    },
                    "values": {
                        "type": "object",
                        "description": "Field values to update"
                    }
                },
                "required": ["model", "record_id", "values"]
            }
        ),
        Tool(
            name="zentere_unlink",
            description="Delete a record from Zentere API",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "record_id": {
                        "type": "integer",
                        "description": "ID of the record to delete"
                    }
                },
                "required": ["model", "record_id"]
            }
        ),
        Tool(
            name="zentere_search_count",
            description="Count records matching a domain filter in Zentere API",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "domain": {
                        "type": "array",
                        "description": "Search domain filter"
                    }
                },
                "required": ["model"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""
    
    try:
        if name == "zentere_authenticate":
            result = api_client.authenticate(
                arguments["username"],
                arguments["password"]
            )
            return [TextContent(
                type="text",
                text=f"✓ Authentication successful!\n\nToken expires in: {result.get('expires_in')} seconds\nToken type: {result.get('token_type')}"
            )]
        
        elif name == "zentere_search_read":
            records = api_client.search_read(
                model=arguments["model"],
                fields=arguments.get("fields"),
                domain=arguments.get("domain"),
                limit=arguments.get("limit", 100),
                offset=arguments.get("offset", 0),
                order=arguments.get("order")
            )
            return [TextContent(
                type="text",
                text=f"✓ Retrieved {len(records)} records from {arguments['model']}\n\n{json.dumps(records, indent=2)}"
            )]
        
        elif name == "zentere_create":
            record_id = api_client.create(
                model=arguments["model"],
                values=arguments["values"]
            )
            return [TextContent(
                type="text",
                text=f"✓ Created record with ID: {record_id} in {arguments['model']}"
            )]
        
        elif name == "zentere_write":
            api_client.write(
                model=arguments["model"],
                record_id=arguments["record_id"],
                values=arguments["values"]
            )
            return [TextContent(
                type="text",
                text=f"✓ Updated record ID: {arguments['record_id']} in {arguments['model']}"
            )]
        
        elif name == "zentere_unlink":
            api_client.unlink(
                model=arguments["model"],
                record_id=arguments["record_id"]
            )
            return [TextContent(
                type="text",
                text=f"✓ Deleted record ID: {arguments['record_id']} from {arguments['model']}"
            )]
        
        elif name == "zentere_search_count":
            count = api_client.search_count(
                model=arguments["model"],
                domain=arguments.get("domain")
            )
            return [TextContent(
                type="text",
                text=f"✓ Found {count} records in {arguments['model']}"
            )]
        
        else:
            return [TextContent(
                type="text",
                text=f"Unknown tool: {name}"
            )]
    
    except Exception as e:
        return [TextContent(
            type="text",
            text=f"❌ Error: {str(e)}"
        )]


async def main():
    """Run the MCP server"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
