# Fix Node.js Permission Error

## 🚨 The Error
```
/c/Program Files/nodejs/node.exe: Permission denied
Could not determine Node.js install directory
```

## 🔧 Quick Solutions

### Solution 1: Use Command Prompt (Easiest)
Instead of Git Bash or PowerShell, use Command Prompt:

1. **Press Windows + R**
2. **Type:** `cmd`
3. **Press Enter**
4. **Navigate to project:**
   ```cmd
   cd "C:\Users\Admin\OneDrive\Documents\FLEKIT"
   ```
5. **Start backend:**
   ```cmd
   cd backend
   npm run dev
   ```

### Solution 2: Run as Administrator
1. **Right-click** on Command Prompt or PowerShell
2. **Select "Run as Administrator"**
3. **Navigate and run:**
   ```cmd
   cd "C:\Users\Admin\OneDrive\Documents\FLEKIT\backend"
   npm run dev
   ```

### Solution 3: Use the Batch Files (Recommended)
The batch files bypass this issue completely:

1. **Double-click:** `start-backend.bat`
2. **Double-click:** `start-frontend.bat` (in new window)

### Solution 4: Fix Node.js Permissions
```cmd
# Run as Administrator
icacls "C:\Program Files\nodejs" /grant Users:F /T
```

## 🎯 Recommended Steps for Adanma

**Step 1: Start Backend**
```cmd
# Open Command Prompt (not PowerShell/Git Bash)
cd "C:\Users\Admin\OneDrive\Documents\FLEKIT"
start-backend.bat
```

**Step 2: Start Frontend**
```cmd
# Open NEW Command Prompt window
cd "C:\Users\Admin\OneDrive\Documents\FLEKIT"
start-frontend.bat
```

**Step 3: Open Browser**
```
http://localhost:3000
```

## 🔍 Why This Happens

- **Git Bash/PowerShell**: Sometimes have permission issues with Node.js
- **Windows Security**: Blocks access to Program Files
- **Path Issues**: Mixed path formats cause problems

## ✅ Success Indicators

When working correctly:
```
✓ Database connection established successfully
✓ Server running on port 5000
```

And:
```
➜  Local:   http://localhost:3000/
```

---

**🚀 Use Command Prompt or the batch files to avoid this issue completely!**