# API Enable/Disable Feature

## ✅ Feature Added

Added the ability to enable/disable OpenAI and OpenRouter APIs individually through the Settings dialog.

## 🎯 Location

**Settings Button** → **Preferences Tab** → **Provider Enable/Disable Section**

## 📊 What Was Added

### 1. Enable/Disable Toggles

Two toggle switches to control each API provider:

```
┌─────────────────────────────────────────┐
│ Provider Enable/Disable                 │
├─────────────────────────────────────────┤
│                                         │
│ OpenAI                          [ON/OFF]│
│ Enable OpenAI API for high-quality     │
│ responses                               │
│                                         │
│ OpenRouter                      [ON/OFF]│
│ Enable OpenRouter API for free models  │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Validation

- **Warning**: If both providers are disabled, shows alert
- **Auto-switch**: If preferred provider is disabled, automatically switches to enabled one
- **Save prevention**: Cannot save if both are disabled

### 3. Visual Feedback

- Disabled providers show "(Disabled)" label
- Radio buttons are disabled for turned-off providers
- Warning alert appears if both are off

## 🔧 How to Use

### Step 1: Open Settings
1. Click the **Settings** button (gear icon) in the header
2. Dialog opens with API configuration

### Step 2: Go to Preferences Tab
1. Click **Preferences** tab
2. See "Provider Enable/Disable" section at top

### Step 3: Toggle Providers
1. **OpenAI Toggle**:
   - ON = OpenAI API is active
   - OFF = OpenAI API is disabled

2. **OpenRouter Toggle**:
   - ON = OpenRouter API is active
   - OFF = OpenRouter API is disabled

### Step 4: Set Preference
1. Choose preferred provider (if both enabled)
2. Disabled providers cannot be selected
3. System uses enabled provider

### Step 5: Save
1. Click **Save Configuration**
2. Settings are saved
3. Dialog closes

## 📋 Use Cases

### Use Case 1: Use Only OpenAI
```
✅ OpenAI: ON
❌ OpenRouter: OFF
Preferred: OpenAI
```
**Result**: Only OpenAI is used, no fallback

### Use Case 2: Use Only OpenRouter (Free)
```
❌ OpenAI: OFF
✅ OpenRouter: ON
Preferred: OpenRouter
```
**Result**: Only OpenRouter is used, no fallback

### Use Case 3: Use Both with Fallback
```
✅ OpenAI: ON
✅ OpenRouter: ON
Preferred: OpenAI
```
**Result**: Uses OpenAI first, falls back to OpenRouter if needed

### Use Case 4: Cost Control
```
❌ OpenAI: OFF (to avoid costs)
✅ OpenRouter: ON (free tier)
Preferred: OpenRouter
```
**Result**: No OpenAI charges, uses free OpenRouter

## ⚠️ Validation Rules

### Rule 1: At Least One Enabled
```
❌ OpenAI: OFF
❌ OpenRouter: OFF
```
**Error**: "At least one API provider must be enabled"
**Action**: Cannot save, must enable at least one

### Rule 2: Auto-Switch Preference
```
Before Save:
✅ OpenAI: ON → OFF
Preferred: OpenAI

After Save:
❌ OpenAI: OFF
✅ OpenRouter: ON
Preferred: OpenRouter (auto-switched)
```

### Rule 3: Disabled Provider Cannot Be Preferred
```
❌ OpenAI: OFF
✅ OpenRouter: ON
Preferred: OpenAI (radio disabled)
```
**Result**: Cannot select disabled provider

## 🎨 Visual States

### Both Enabled
```
┌─────────────────────────────────────┐
│ ● OpenAI (High Quality)             │
│ ○ OpenRouter (Free)                 │
└─────────────────────────────────────┘
```

### OpenAI Disabled
```
┌─────────────────────────────────────┐
│ ○ OpenAI (High Quality) (Disabled)  │ ← Grayed out
│ ● OpenRouter (Free)                 │
└─────────────────────────────────────┘
```

### OpenRouter Disabled
```
┌─────────────────────────────────────┐
│ ● OpenAI (High Quality)             │
│ ○ OpenRouter (Free) (Disabled)      │ ← Grayed out
└─────────────────────────────────────┘
```

### Both Disabled (Warning)
```
┌─────────────────────────────────────┐
│ ⚠️ Warning: At least one API        │
│    provider must be enabled         │
└─────────────────────────────────────┘
```

## 💾 Configuration Storage

Settings are stored in:
```javascript
{
  enableOpenAI: true/false,
  enableOpenRouter: true/false,
  preferredProvider: 'openai' | 'openrouter',
  openaiKey: 'sk-...',
  openrouterKey: 'sk-or-v1-...',
  model: 'gpt-4o-mini',
  openrouterModel: 'deepseek/deepseek-chat-v3.1:free'
}
```

## 🔄 Behavior

### When Provider is Disabled

1. **API Calls**: Skipped for disabled provider
2. **Fallback**: Only uses enabled provider
3. **Health Check**: Shows as "Disabled" in status
4. **Testing**: Test button disabled
5. **Selection**: Cannot be set as preferred

### When Both Enabled

1. **Primary**: Uses preferred provider first
2. **Fallback**: Switches to alternative if primary fails
3. **Health Check**: Monitors both
4. **Testing**: Can test both
5. **Selection**: Can choose either as preferred

## 🎯 Benefits

1. **Cost Control**: Disable paid APIs to avoid charges
2. **Free Usage**: Use only free OpenRouter models
3. **Quality Control**: Use only high-quality OpenAI
4. **Flexibility**: Switch between providers easily
5. **Testing**: Test one provider at a time
6. **Debugging**: Isolate provider issues

## 📝 Examples

### Example 1: Development (Free)
```
Settings:
- OpenAI: OFF
- OpenRouter: ON
- Preferred: OpenRouter

Result: Uses free OpenRouter models, no costs
```

### Example 2: Production (Quality)
```
Settings:
- OpenAI: ON
- OpenRouter: OFF
- Preferred: OpenAI

Result: Uses OpenAI only, highest quality
```

### Example 3: Hybrid (Best of Both)
```
Settings:
- OpenAI: ON
- OpenRouter: ON
- Preferred: OpenAI

Result: Uses OpenAI primarily, OpenRouter as backup
```

## 🐛 Troubleshooting

### Cannot Save Settings
**Problem**: "At least one API provider must be enabled"
**Solution**: Enable at least one provider before saving

### Preferred Provider Grayed Out
**Problem**: Cannot select preferred provider
**Solution**: Enable the provider first, then select it

### No API Responses
**Problem**: Both providers disabled
**Solution**: Enable at least one provider in settings

### Unexpected Provider Used
**Problem**: Wrong provider being used
**Solution**: Check which provider is enabled and preferred

## 🔍 Testing

### Test Enable/Disable
1. Open Settings → Preferences
2. Toggle OpenAI OFF
3. Verify radio button is disabled
4. Toggle OpenAI ON
5. Verify radio button is enabled

### Test Validation
1. Turn both providers OFF
2. Try to save
3. Should show error
4. Turn one ON
5. Should save successfully

### Test Auto-Switch
1. Set preferred to OpenAI
2. Turn OpenAI OFF
3. Save settings
4. Verify preferred switched to OpenRouter

## ✅ Success Indicators

- [ ] Settings dialog has Preferences tab
- [ ] Preferences tab shows Enable/Disable section
- [ ] Two toggle switches visible (OpenAI, OpenRouter)
- [ ] Toggles work (ON/OFF)
- [ ] Warning appears if both OFF
- [ ] Cannot save if both OFF
- [ ] Disabled providers show "(Disabled)"
- [ ] Radio buttons disabled for OFF providers
- [ ] Auto-switches preference if needed
- [ ] Settings persist after save

## 🎉 Result

Users can now:
- ✅ Enable/disable OpenAI individually
- ✅ Enable/disable OpenRouter individually
- ✅ Control which APIs are used
- ✅ Avoid costs by disabling paid APIs
- ✅ Use only free models if desired
- ✅ Have full control over API usage

**Feature is complete and ready to use!** ⚙️
