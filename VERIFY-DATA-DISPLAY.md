# Verify Data Display - Step by Step

## Current Status
✅ Proxy is working and returning data
✅ API client is fetching data
✅ App provider is loading data
❓ Need to verify data appears in BU/LOB selector

## Testing Steps

### Step 1: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 2: Open Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Clear console (trash icon)

### Step 3: Login
1. Go to `http://localhost:3000/login`
2. Click "Auto-fill Demo Credentials"
3. Click "Sign In"

### Step 4: Watch Console Logs

You should see this sequence:

```
🔐 Authenticating with: martin@demo.com
✅ Authentication successful, token received
✅ Authentication successful, fetching data...
📊 Loaded BUs: X [array]
📊 First BU structure: {id, name, lobs, ...}
📊 First BU LOBs: [array of LOBs]
✅ State updated with business units
🔍 BU/LOB Selector - businessUnits: X [array]
```

### Step 5: Check BU/LOB Selector

1. **Look at top-left corner** - Should see "Select a Business Unit" button
2. **Click the button** - Dropdown should open
3. **Check dropdown content**:
   - Should see Business Unit names (e.g., "Mass Order Services")
   - Each BU should have a folder icon with color
   - Hover over BU to see its LOBs

### Step 6: Select a Business Unit

1. **Hover over a Business Unit** - Submenu should appear
2. **Check submenu**:
   - Should show LOB names
   - Each LOB should have a checkmark or warning icon
   - Green checkmark = has data
   - Yellow warning = no data

### Step 7: Select a Line of Business

1. **Click on a LOB** - Should select it
2. **Check chat area** - Should show LOB details:
   - LOB name
   - Code
   - Record count
   - Data quality
   - Whether it has data

### Step 8: Verify Data Structure

In console, run:
```javascript
// Check state
const state = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber()?.return?.stateNode?.state;
console.log('State:', state);
console.log('Business Units:', state?.businessUnits);
```

Or use React DevTools:
1. Open React DevTools
2. Find `AppProvider` component
3. Check `state.businessUnits`
4. Should be an array with objects

## Expected Data Structure

### Business Unit
```javascript
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
```

## Troubleshooting

### Console Shows "Loaded BUs: 0"
**Problem:** Backend has no data or data format is wrong

**Check:**
1. Open Network tab
2. Find `/api/proxy` request with action: 'search_read'
3. Check Response tab
4. Should see array of records with `business_unit_id` and `lob_id`

**Fix:**
- Verify backend `data_feeds` table has records
- Check `business_unit_id` format is `[id, "name"]`
- Check `lob_id` format is `[id, "name"]`

### Console Shows Data But Selector is Empty
**Problem:** State not updating or selector not reading state

**Check:**
1. Console should show: `🔍 BU/LOB Selector - businessUnits: X`
2. If X = 0, state is not updating
3. If X > 0, selector should show data

**Fix:**
```javascript
// In console, force re-render
location.reload();
```

### Selector Shows BUs But No LOBs
**Problem:** LOBs not being fetched or transformed correctly

**Check:**
1. Console log: `📊 First BU LOBs: [array]`
2. Should show array of LOB objects
3. If empty, no LOBs in backend for that BU

**Fix:**
- Check backend has LOBs for the BU
- Verify `lob_id` field is populated in `data_feeds`

### Can Select LOB But No Data Shows
**Problem:** LOB data not being fetched

**Check:**
1. LOB object should have `mockData` array
2. `mockData` should contain records with Date, Value, Orders
3. `hasData` should be true
4. `recordCount` should be > 0

**Fix:**
- Check `getDataForLOB()` is being called
- Verify it returns data
- Check data transformation is correct

## Success Criteria

✅ Console shows authentication success
✅ Console shows "Loaded BUs: X" where X > 0
✅ Console shows BU structure with lobs array
✅ Console shows "BU/LOB Selector - businessUnits: X" where X > 0
✅ BU/LOB selector button appears
✅ Clicking selector shows dropdown
✅ Dropdown shows Business Unit names
✅ Hovering BU shows LOBs submenu
✅ LOBs have icons (green checkmark or yellow warning)
✅ Clicking LOB selects it
✅ Chat shows LOB details
✅ LOB has data (mockData array with records)

## What You Should See

### In Dropdown
```
📁 Mass Order Services
  └─ ✅ Retail Operations
  └─ ✅ Wholesale Operations
  └─ ⚠️  New Operations (no data)

📁 Customer Service
  └─ ✅ Support Team
  └─ ✅ Sales Team

+ New Business Unit
```

### In Chat After Selecting LOB
```
✅ Selected: Retail Operations

Business Unit: Mass Order Services
Line of Business: Retail Operations
Code: LOB15
Record Count: 1,250
Data Quality: Good
Has Data: Yes

You can now:
• View data visualization
• Run forecasting analysis
• Export data
```

## Next Steps After Verification

1. ✅ Verify BUs and LOBs appear
2. ✅ Verify LOB selection works
3. ✅ Verify data is loaded (mockData array)
4. Test data visualization
5. Test forecasting with real data
6. Add data refresh button
7. Add CRUD operations

## Quick Debug Commands

```javascript
// Check if data is loaded
console.log('BUs:', window.__APP_STATE__?.businessUnits);

// Check specific BU
console.log('First BU:', window.__APP_STATE__?.businessUnits[0]);

// Check LOBs
console.log('First BU LOBs:', window.__APP_STATE__?.businessUnits[0]?.lobs);

// Check selected
console.log('Selected BU:', window.__APP_STATE__?.selectedBu);
console.log('Selected LOB:', window.__APP_STATE__?.selectedLob);
```

## If Everything Works

You should now have:
- ✅ Real Business Units from backend
- ✅ Real Lines of Business from backend
- ✅ Actual data_feeds records
- ✅ Working BU/LOB selector
- ✅ Ability to select and view LOB data
- ✅ Data ready for visualization and forecasting

**The integration is complete!** 🎉
