# Quick Start Guide - See Your Data Now!

## 🚀 3 Simple Steps

### Step 1: Start the Server
```bash
npm run dev
```

### Step 2: Login
1. Go to `http://localhost:3000/login`
2. Click "Auto-fill Demo Credentials"
3. Click "Sign In"

### Step 3: Click BU/LOB Selector
1. Look at **top-left corner**
2. Click the button that says "Select a Business Unit"
3. **You should see your Business Units!**

## 📊 What You'll See

### Dropdown Menu
```
📁 Mass Order Services          ← Your Business Unit
  └─ ✅ Retail Operations       ← LOB with data
  └─ ✅ Wholesale Operations    ← LOB with data
  
📁 Customer Service
  └─ ✅ Support Team
  
+ New Business Unit             ← Create new
```

### After Selecting a LOB
The chat will show:
```
✅ Selected: Retail Operations

• Business Unit: Mass Order Services
• Record Count: 1,250 records
• Has Data: Yes
• Data Quality: Good

Ready for analysis!
```

## 🔍 Console Output

Open DevTools Console (F12) to see:
```
🔐 Authenticating with: martin@demo.com
✅ Authentication successful
📊 Loaded BUs: 3
✅ State updated with business units
🔍 BU/LOB Selector - businessUnits: 3
```

## ✅ Success Checklist

- [ ] Server is running
- [ ] Can access login page
- [ ] Can login successfully
- [ ] Console shows "Loaded BUs: X" (X > 0)
- [ ] BU/LOB selector button appears
- [ ] Clicking selector shows dropdown
- [ ] Dropdown shows Business Units
- [ ] Can see LOBs under each BU
- [ ] Can select a LOB
- [ ] Chat shows LOB details

## 🎯 Your Data Structure

Each Business Unit contains:
- **Name** - e.g., "Mass Order Services"
- **LOBs** - Lines of Business under this BU
- **Color** - Visual identifier

Each Line of Business contains:
- **Name** - e.g., "Retail Operations"
- **Data** - Array of records with Date and Value
- **Record Count** - Number of data points
- **Status** - Whether it has data or not

## 📈 View Your Data

After selecting a LOB:
1. Data is loaded in `mockData` array
2. Each record has:
   - **Date** - Time point
   - **Value** - Metric value
   - **Orders** - Additional metric

Example:
```javascript
{
  Date: "2021-01-04",
  Value: 26858.0,
  Orders: 0
}
```

## 🔧 If Something's Wrong

### No BUs Showing?
**Check console:**
- Should see "Loaded BUs: X" where X > 0
- If X = 0, backend has no data

**Fix:**
1. Check backend `data_feeds` table has records
2. Verify `business_unit_id` field is populated
3. Check Network tab for `/api/proxy` responses

### Selector is Empty?
**Check console:**
- Should see "BU/LOB Selector - businessUnits: X"
- If X = 0, state not updating

**Fix:**
1. Hard refresh: Ctrl+Shift+R
2. Clear cache and reload
3. Check React DevTools for state

### Can't Select LOB?
**Check:**
- LOB should have green checkmark (has data)
- Yellow warning means no data yet

**Fix:**
- Select a LOB with green checkmark
- Or upload data to LOB with yellow warning

## 🎉 You're Done!

Once you see:
- ✅ Business Units in dropdown
- ✅ LOBs under each BU
- ✅ Can select a LOB
- ✅ Chat shows LOB details

**Your data is connected and ready to use!**

## 📚 Next Steps

1. **Visualize Data** - View charts and graphs
2. **Run Forecasting** - Predict future values
3. **Analyze Trends** - Understand patterns
4. **Export Data** - Download reports
5. **Upload More Data** - Add new records

## 💡 Pro Tips

- **Green checkmark** = LOB has data, ready for analysis
- **Yellow warning** = LOB exists but needs data
- **Eye icon** = Preview existing data
- **Upload icon** = Add new data
- **+ New Business Unit** = Create more BUs
- **+ Add Line of Business** = Create more LOBs

## 🆘 Need Help?

Check these files:
- `VERIFY-DATA-DISPLAY.md` - Detailed verification steps
- `CORS-FIX-AND-TESTING.md` - Proxy and API info
- `FINAL-INTEGRATION-SUMMARY.md` - Complete overview

Or check console for error messages!
