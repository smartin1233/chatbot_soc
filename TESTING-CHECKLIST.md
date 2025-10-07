# Testing Checklist ✅

## Quick Test Steps

### 1. Start the Application
```bash
npm run dev
```
- [ ] App starts without errors
- [ ] No build errors in terminal

### 2. Access Login Page
- [ ] Navigate to `http://localhost:3000`
- [ ] Automatically redirects to `/login`
- [ ] Login page displays correctly
- [ ] See "AI Assistant" branding
- [ ] See demo credentials box

### 3. Login
- [ ] Click "Auto-fill Demo Credentials" button
- [ ] Username fills with `martin@demo.com`
- [ ] Password fills with `demo`
- [ ] Click "Sign In"
- [ ] Redirects to `/main` page

### 4. Check Console Logs
Open DevTools Console (F12), you should see:
- [ ] `🔐 Authenticating with: martin@demo.com`
- [ ] `✅ Authentication successful, fetching data...`
- [ ] `📊 Loaded BUs: X` (where X > 0)
- [ ] Array of business units logged

### 5. Check Chat Messages
In the chat area, you should see:
- [ ] Initial welcome message
- [ ] "🔄 Loading your Business Units..." message
- [ ] "✅ Successfully loaded from backend!" message
- [ ] Summary showing:
  - Number of Business Units
  - Number of Lines of Business
  - Number of LOBs with data

### 6. Check BU/LOB Selector
- [ ] Click the BU/LOB selector (top left corner)
- [ ] Dropdown opens
- [ ] Shows REAL Business Units (not "Retail Operations", "E-Commerce", etc.)
- [ ] Business Units have actual names from your backend
- [ ] Each BU has Lines of Business under it

### 7. Select a Business Unit
- [ ] Click on a Business Unit
- [ ] BU expands to show Lines of Business
- [ ] LOBs are listed under the BU

### 8. Select a Line of Business
- [ ] Click on a Line of Business
- [ ] Chat shows LOB details:
  - LOB name
  - Code
  - Record count
  - Data quality
  - Whether it has data
- [ ] Suggestions appear in chat

### 9. Check Network Tab
Open DevTools Network tab:
- [ ] Filter by "zentere"
- [ ] See `/authentication/oauth2/token` request (Status: 200)
- [ ] See multiple `/search_read` requests (Status: 200)
- [ ] No 401 or 403 errors
- [ ] No 500 errors

### 10. Verify Data Structure
In React DevTools:
- [ ] Find `AppProvider` component
- [ ] Check `state.businessUnits`
- [ ] Should be an array with objects
- [ ] Each object has: id, name, code, lobs
- [ ] Each lob has: id, name, hasData, recordCount, mockData

## Expected Results

### Console Output
```
🔐 Authenticating with: martin@demo.com
✅ Authentication successful, fetching data...
📊 Loaded BUs: 3 [Array of business units]
```

### Chat Messages
```
Hello! I'm your BI forecasting assistant...

🔄 Loading your Business Units and Lines of Business from the backend...

✅ Successfully loaded from backend!

📊 Summary:
• 3 Business Units
• 8 Lines of Business
• 6 LOBs with data

Select a Business Unit and Line of Business to get started with analysis.
```

### BU/LOB Selector
```
📁 Mass Order Services
  └─ 📊 Retail Operations (1250 records)
  └─ 📊 Wholesale Operations (890 records)

📁 Customer Service
  └─ 📊 Support Team (450 records)
  └─ 📊 Sales Team (320 records)
```

## Troubleshooting

### ❌ Login Page Not Showing
**Fix:**
1. Clear browser cache
2. Check URL is exactly `http://localhost:3000/login`
3. Check console for errors

### ❌ No Data Loading
**Check:**
1. Console logs - should see authentication messages
2. Network tab - should see API calls
3. localStorage - should have `isAuthenticated`, `zentere_username`, `zentere_password`

**Fix:**
```javascript
// In browser console
localStorage.clear();
location.reload();
// Then login again
```

### ❌ Still Shows Mock Data
**Check:**
1. Which app-provider is being used?
   - Should be: `src/components/dashboard/app-provider.tsx`
   - NOT: `app-provider.tsx` (root)
2. Check if `mockBusinessUnits` is imported
3. Check if `businessUnits: []` in initialState

**Fix:**
```bash
# Rebuild the app
npm run build
npm run dev
```

### ❌ Authentication Fails
**Check:**
1. Backend is accessible: `https://app-api-dev.zentere.com`
2. Credentials are correct
3. Network tab shows 200 response for auth

**Fix:**
- Try default credentials: `martin@demo.com` / `demo`
- Check backend is running
- Check CORS settings

### ❌ Empty BU/LOB Selector
**Check:**
1. Console shows "Loaded BUs: 0"
2. Backend has data in `data_feeds` table
3. `business_unit_id` and `lob_id` fields are populated

**Fix:**
- Verify backend data exists
- Check data format matches expected structure
- Check console for parsing errors

## Success Criteria

All of these should be ✅:
- [ ] Login page works
- [ ] Can login with any credentials
- [ ] Data loads automatically
- [ ] Console shows authentication logs
- [ ] Console shows "Loaded BUs: X" where X > 0
- [ ] Chat shows success message
- [ ] BU/LOB selector shows real data
- [ ] Can select BU and LOB
- [ ] LOB details appear in chat
- [ ] No mock data visible
- [ ] No errors in console
- [ ] Network tab shows successful API calls

## If All Tests Pass ✅

**Congratulations!** The backend integration is working correctly. You now have:
- Real data from your Zentere API
- Automatic data loading on login
- Working BU/LOB selection
- Actual data_feeds records

## Next Actions

1. Test data visualization with real data
2. Test forecasting with real data
3. Implement CRUD operations
4. Add data refresh functionality
5. Add error recovery
6. Add loading indicators
