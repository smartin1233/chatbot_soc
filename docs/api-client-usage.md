# Zentere API Client Usage Guide

## Quick Start

### 1. Import the Client
```typescript
import { getAPIClient } from '@/lib/api-client';
```

### 2. Authenticate
```typescript
const apiClient = getAPIClient();
await apiClient.authenticate('username', 'password');
```

### 3. Fetch Data

#### Get All Business Units with LOBs
```typescript
const businessUnits = await apiClient.getBusinessUnitsWithLOBs();
// Returns: BusinessUnit[] with nested lobs
```

#### Get Business Units Only
```typescript
const bus = await apiClient.getBusinessUnits();
// Returns: Array<{ id: string; name: string }>
```

#### Get Lines of Business Only
```typescript
const lobs = await apiClient.getLinesOfBusiness();
// Returns: Array<{ id: string; name: string; businessUnitId: string }>
```

## Advanced Usage

### Custom Search Query
```typescript
const records = await apiClient.searchRead(
  'data_feeds',                    // model name
  ['id', 'business_unit_id'],      // fields to fetch
  [['date', '>=', '2024-01-01']],  // domain filter
  100,                              // limit
  0,                                // offset
  'date desc'                       // order
);
```

## Data Structure

### Backend Response (data_feeds)
```json
{
  "id": 213945,
  "business_unit_id": [9, "Mass Order Services"],
  "lob_id": [15, "Retail Operations"],
  "date": "2021-01-04 00:00:00",
  "value": 26858.0
}
```

### Transformed BusinessUnit
```typescript
{
  id: "9",
  name: "Mass Order Services",
  description: "Business Unit: Mass Order Services",
  code: "BU9",
  startDate: Date,
  displayName: "Mass Order Services",
  color: "#3b82f6",
  createdDate: Date,
  updatedDate: Date,
  status: "active",
  lobs: [
    {
      id: "15",
      name: "Retail Operations",
      description: "Line of Business: Retail Operations",
      code: "LOB15",
      businessUnitId: "9",
      startDate: Date,
      hasData: true,
      dataUploaded: Date,
      recordCount: 0,
      dataQuality: { trend: "stable", seasonality: "moderate" },
      createdDate: Date,
      updatedDate: Date,
      status: "active"
    }
  ]
}
```

## Error Handling

```typescript
try {
  const apiClient = getAPIClient();
  await apiClient.authenticate('user', 'pass');
  const data = await apiClient.getBusinessUnitsWithLOBs();
} catch (error) {
  console.error('API Error:', error);
  // Handle authentication or network errors
}
```

## Integration with App Provider

The API client is automatically used in `app-provider.tsx`:

```typescript
useEffect(() => {
  const loadBusinessUnits = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiClient = getAPIClient();
      await apiClient.authenticate(username, password);
      const businessUnits = await apiClient.getBusinessUnitsWithLOBs();
      dispatch({ type: 'SET_BUSINESS_UNITS', payload: businessUnits });
    } catch (error) {
      console.error('Failed to load business units:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  loadBusinessUnits();
}, [state.isAuthenticated]);
```

## API Endpoints

- **Base URL**: `https://app-api-dev.zentere.com/api/v2`
- **Authentication**: `/authentication/oauth2/token`
- **Search/Read**: `/search_read?model={model_name}`

## Credentials

Default credentials (stored in localStorage):
- Username: `martin@demo.com`
- Password: `demo`

To change credentials:
```typescript
localStorage.setItem('zentere_username', 'your_username');
localStorage.setItem('zentere_password', 'your_password');
```

## Notes

- The API client uses a singleton pattern - one instance per app
- Authentication token is stored in memory (not persisted)
- Token expires after 3600 seconds (1 hour)
- All requests require authentication first
- The client automatically extracts unique BUs and LOBs from data_feeds
