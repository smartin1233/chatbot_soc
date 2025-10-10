# Chat Font Size Increase

## Changes Made

Increased the font size in the chat area for better readability in both user messages and assistant responses.

### 1. Main Message Container
**Before:**
```typescript
'rounded-xl p-4 text-sm prose prose-sm max-w-none'
```

**After:**
```typescript
'rounded-xl p-4 text-base prose prose-base max-w-none'
```

**Impact:**
- Base text size increased from `text-sm` (14px) to `text-base` (16px)
- Prose typography increased from `prose-sm` to `prose-base`
- Applies to both user messages and assistant responses

### 2. Headers
**Before:**
```
### Header → text-sm (14px)
## Header  → text-base (16px)
# Header   → text-lg (18px)
```

**After:**
```
### Header → text-base (16px)  ⬆️ +2px
## Header  → text-lg (18px)    ⬆️ +2px
# Header   → text-xl (20px)    ⬆️ +2px
```

### 3. Tables
**Before:**
```typescript
<td class="border px-2 py-1 text-xs">  // 12px
```

**After:**
```typescript
<td class="border px-2 py-1 text-sm">  // 14px ⬆️ +2px
```

### 4. Code Blocks
**Before:**
```typescript
<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">  // 12px
```

**After:**
```typescript
<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">  // 14px ⬆️ +2px
```

## Font Size Reference

| Element | Before | After | Change |
|---------|--------|-------|--------|
| Body text | 14px (`text-sm`) | 16px (`text-base`) | +2px |
| H3 (###) | 14px (`text-sm`) | 16px (`text-base`) | +2px |
| H2 (##) | 16px (`text-base`) | 18px (`text-lg`) | +2px |
| H1 (#) | 18px (`text-lg`) | 20px (`text-xl`) | +2px |
| Tables | 12px (`text-xs`) | 14px (`text-sm`) | +2px |
| Code | 12px (`text-xs`) | 14px (`text-sm`) | +2px |
| Bullet points | 16px (inherited) | 16px (inherited) | Same |
| Numbers | 16px (inherited) | 16px (inherited) | Same |

## Visual Comparison

### Before
```
User Message:     [14px] "Generate forecast"
Assistant:        [14px] "I'll help you generate a forecast..."
  Headers:        [14px] ### Step 1
  Body:           [14px] Regular text
  Code:           [12px] `code snippet`
  Tables:         [12px] | Cell |
```

### After
```
User Message:     [16px] "Generate forecast"
Assistant:        [16px] "I'll help you generate a forecast..."
  Headers:        [16px] ### Step 1
  Body:           [16px] Regular text
  Code:           [14px] `code snippet`
  Tables:         [14px] | Cell |
```

## Benefits

1. **Better Readability** - Larger text is easier to read, especially for longer conversations
2. **Reduced Eye Strain** - 16px is closer to standard web body text size
3. **Improved Accessibility** - Larger text helps users with visual impairments
4. **Professional Appearance** - Matches modern chat interface standards
5. **Consistent Hierarchy** - Headers are now more distinct from body text

## File Modified
- `src/components/dashboard/enhanced-chat-panel.tsx` (lines 1450, 1512-1514, 1517, 1527)

## Testing

Test the new font sizes:
- [ ] User messages are more readable
- [ ] Assistant responses are more readable
- [ ] Headers have clear visual hierarchy
- [ ] Code blocks are legible
- [ ] Tables are easy to read
- [ ] Bullet points and lists look good
- [ ] Overall chat feels more comfortable to read

## Notes

- The increase is subtle (+2px) but noticeable
- All text elements scale proportionally
- Maintains visual hierarchy between different text types
- Responsive design is preserved
- No layout breaking changes
