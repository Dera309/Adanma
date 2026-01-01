# Fix PowerShell Execution Policy Error

## The Error
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded 
because running scripts is disabled on this system.
```

## Quick Solutions

### Solution 1: Enable PowerShell Scripts (Recommended)

**Step 1:** Open PowerShell as Administrator
- Press `Windows + X`
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

**Step 2:** Run this command:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Step 3:** Type `Y` and press Enter when prompted

**Step 4:** Close and reopen your terminal, then try npm again

### Solution 2: Use Command Prompt Instead

Instead of PowerShell, use Command Prompt (cmd):

**Step 1:** Open Command Prompt
- Press `Windows + R`
- Type `cmd` and press Enter

**Step 2:** Navigate to your project:
```cmd
cd "C:\Users\Admin\OneDrive\Documents\FLEKIT"
```

**Step 3:** Run npm commands:
```cmd
cd backend
npm run dev
```

### Solution 3: Use the Batch Files (Easiest)

Use the batch files we created earlier:

1. **Double-click `start-backend.bat`** (starts backend)
2. **Double-click `start-frontend.bat`** (starts frontend)

These bypass PowerShell entirely!

### Solution 4: Bypass Policy for Single Command

Run this in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

## Test the Fix

After applying Solution 1, test it:
```powershell
npm --version
```

You should see the npm version without errors.

## Why This Happens

Windows PowerShell has security policies that prevent running scripts by default. The `RemoteSigned` policy allows:
- ✅ Local scripts to run
- ✅ Downloaded scripts that are digitally signed
- ❌ Downloaded unsigned scripts

This is safe for development while maintaining security.

## Alternative: Use Node Directly

If npm still doesn't work, you can run Node.js directly:

**Backend:**
```cmd
cd backend
node dist/index.js
```

**But first build it:**
```cmd
cd backend
npx tsc
node dist/index.js
```

## Permanent Fix for Development

Add this to your PowerShell profile to make it permanent:

1. Open PowerShell as Admin
2. Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. This applies to your user account only (safe)

## Quick Commands Reference

**Check current policy:**
```powershell
Get-ExecutionPolicy
```

**Set policy for current user:**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Temporarily bypass (single command):**
```powershell
powershell -ExecutionPolicy Bypass -Command "your-command-here"
```

---

## For Adanma Development

Once fixed, you can run:

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend  
npm run dev
```

Or use the batch files:
- `start-backend.bat`
- `start-frontend.bat`