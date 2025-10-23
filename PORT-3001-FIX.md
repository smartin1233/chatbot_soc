# Port 3001 Already in Use - Fix

## The Error You Saw
```
Error: listen EADDRINUSE: address already in use :::3001
```

## What This Means
Port 3001 is already being used by another process (probably a previous instance of your Next.js dev server that didn't shut down properly).

## Quick Fixes

### Option 1: Kill the Process Using Port 3001
```bash
# Find the process ID
lsof -ti:3001

# Kill it (replace PID with the number from above)
kill -9 PID

# Or do it in one command
kill -9 $(lsof -ti:3001)

# Then start your server
npm run dev
```

### Option 2: Use a Different Port
```bash
# Start on port 3002 instead
npm run dev -- --port 3002

# Or edit package.json to change the default port
# Change: "dev": "next dev --turbopack --port 3001"
# To: "dev": "next dev --turbopack --port 3002"
```

### Option 3: Find and Kill All Node Processes
```bash
# Kill all node processes (be careful!)
pkill -9 node

# Then start your server
npm run dev
```

### Option 4: Restart Your Computer
If nothing else works, a restart will clear all processes.

## Recommended Solution

**Use Option 1** - it's the cleanest:

```bash
# One command to kill the process and start fresh
kill -9 $(lsof -ti:3001) 2>/dev/null; npm run dev
```

## Why This Happens

1. You stopped the dev server with Ctrl+C but it didn't fully shut down
2. You closed the terminal without stopping the server
3. The server crashed but the port is still held
4. Multiple instances were started accidentally

## Prevention

Always stop your dev server properly:
- Use `Ctrl+C` in the terminal
- Wait for it to fully shut down
- Don't force-close the terminal

## After Fixing Port Issue

Once your server is running, you can test the forecasting workflow fix:

1. Open http://localhost:3001 (or whatever port you're using)
2. Type "run forecast" in the chatbot
3. The model training form should appear
4. Configure and submit
5. Watch the 6-agent workflow execute

## Still Having Issues?

If the port is still in use after trying these fixes:

```bash
# Check what's using the port
lsof -i:3001

# You'll see output like:
# COMMAND   PID   USER   FD   TYPE  DEVICE  SIZE/OFF  NODE  NAME
# node    12345  user   23u  IPv6  0x...   0t0       TCP   *:3001

# Kill that specific process
kill -9 12345
```

## Alternative: Change Port Permanently

Edit `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3002"
  }
}
```

Then you can always use:
```bash
npm run dev
```

And it will use port 3002 instead.
