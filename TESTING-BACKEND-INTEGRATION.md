# Testing Backend Integration

## How to Test

### 1. Login and Automatic Data Load

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Navigate to login page**: `http://localhost:3000/login`

3. **Login with credentials**:
   - Username: `martin@demo.com` (or any username)
   - Password: `demo` (or any password)
   - These credentials are stored and used for API authentication

4. **Watch the console**:
   - You should see: `🔐 Authenticating with: martin@demo.com`
   - Then: `✅ Authentication successful, fetching data...`
   - Then: `📊 Loaded BUs: X` (where X is the number of Business Units)

5. **Check the chat area**:
   - You should see a message: "🔄 Loading your Business Units and Lines of Business from the backend..."
   - Then it updates to: "✅ Successfully loaded from backend!" with a summary

6. **Click the BU/LOB selector** (top left):
   - You should see real Business Units from your backend
   - Each BU should have its Lines of Business
   - LOBs with data will show record counts

### 2. Verify Real Data is Loaded

Open browser DevTools Console and run:

```javascript
// Check if data is loaded
const state = window.__APP_STATE__;
console.log('Business Units:', state?.businessUnits);
console.log('Total BUs:', state?.businessUnits?.length);
console.log('Total LOBs:', state?.businessUnits?.reduce((sum, bu) => sum + bu.lobs.length, 0));
```

Or check the React DevTools:
1. Open React DevTools
2. Find `AppProvider` component
3. Check `state.businessUnits` - should contain real data from backend

### 3. Test BU/LOB Selection

1. Click the BU/LOB selector dropdown
2. Select a Business Unit
3. Select a Line of Business
4. Check the chat - should show LOB details including:
   - Name
   - Code
   - Record count
   - Data quality
   - Whether it has data

### 4. Test Data Display

1. After selecting a LOB with data
2. Open the Data Panel (if available)
3. You should see actual data_feeds records
4. The data should match what's in your backend

### 5. Test Manual Refresh

In the browser console:

```javascript
// Get the refresh function
const { refreshData } = useApp();
await refreshData();
```

Or add a refresh button to the UI that calls `refreshData()`.

## Expected Behavior

### On Login
```
1. User enters credentials
2. Credentials saved to localStorage
3. Redirect to /main
4. AppProvider mounts
5. useEffect triggers
6. Shows "Loading..." message
7. Authenticates with API
8. Fetches all BUs from data_feeds
9. Fetches all LOBs from data_feeds
10. For each LOB, fetches up to 100 data records
11. Updates state with complete hierarchy
12. Shows success message with counts
```

### Data Structure
```typescript
businessUnits: [
  {
    id: "9",
    name: "Mass Order Services",
    code: "BU9",
    displayName: "Mass Order Services",
    color: "#3b82f6",
    lobs: [
      {
        id: "15",
        name: "Retail Operations",
        code: "LOB15",
        businessUnitId: "9",
        hasData: true,
        recordCount: 1250,
        mockData: [
          {
            Date: Date("2021-01-04"),
            Value: 26858.0,
            Orders: 0
          },
          // ... more records
        ]
      }
    ]
  }
]
```

## Troubleshooting

### No Data Appears

**Check 1: Authentication**
```javascript
// In browser console
console.log('Auth:', localStorage.getItem('isAuthenticated'));
console.log('Username:', localStorage.getItem('zentere_username'));
console.log('Password:', localStorage.getItem('zentere_password'));
```

**Check 2: API Response**
- Open Network tab in DevTools
- Look for requests to `app-api-dev.zentere.com`
- Check if `/authentication/oauth2/token` returns 200
- Check if `/search_read?model=data_feeds` returns data

**Check 3: Console Errors**
- Look for red errors in console
- Common issues:
  - CORS errors (backend needs to allow your domain)
  - Authentication failures (wrong credentials)
  - Network errors (backend down)

### Data Loads But Selector is Empty

**Check 1: State**
```javascript
// In React DevTools
// Find AppProvider > state > businessUnits
// Should be an array with data
```

**Check 2: Selector Component**
- Make sure `bu-lob-selector.tsx` is reading from `state.businessUnits`
- Check if it's filtering or transforming the data incorrectly

### Data Loads But Shows Wrong Information

**Check 1: Data Transformation**
- Check `src/lib/api-client.ts` > `getBusinessUnitsWithLOBs()`
- Verify the mapping from backend format to TypeScript types
- Check if field names match (business_unit_id vs businessUnitId)

**Check 2: Backend Data**
- Verify your backend has the expected data structure
- Check if business_unit_id and lob_id are in the format `[id, "name"]`

## API Endpoints Being Called

### 1. Authentication
```
POST https://app-api-dev.zentere.com/api/v2/authentication/oauth2/token
Body: {
  grant_type: 'password',
  client_id: 'kLPrcbXlsHYelbpm5HzKg8ZgDE2rVXRhGyJ0GdqH',
  username: 'martin@demo.com',
  password: 'demo',
  client_secret: 'IbqUkvq1hWTuc6jK7X6xGClTLThshJhfU6nf7uYm'
}
```

### 2. Get Business Units
```
POST https://app-api-dev.zentere.com/api/v2/search_read?model=data_feeds&fields=["business_unit_id"]&limit=1000
Headers: {
  Authorization: 'Bearer <token>',
  Content-Type: 'application/json'
}
```

### 3. Get Lines of Business
```
POST https://app-api-dev.zentere.com/api/v2/search_read?model=data_feeds&fields=["lob_id","business_unit_id"]&limit=1000
```

### 4. Get Data for Each LOB
```
POST https://app-api-dev.zentere.com/api/v2/search_read?model=data_feeds&fields=["id","date","value","parameter_id","business_unit_id","lob_id"]&domain=[["lob_id","=",15]]&limit=100&order=date asc
```

## Success Indicators

✅ Console shows authentication success
✅ Console shows "Loaded BUs: X" where X > 0
✅ Chat shows success message with counts
✅ BU/LOB selector shows real business units
✅ Selecting a LOB shows its details
✅ Data panel shows actual records
✅ No errors in console
✅ Network tab shows successful API calls

## Next Steps After Successful Test

1. Test CRUD operations (create, update, delete records)
2. Test data upload functionality
3. Test data visualization with real data
4. Test forecasting with real data
5. Add error handling for edge cases
6. Add loading indicators
7. Add data caching
8. Add offline support
