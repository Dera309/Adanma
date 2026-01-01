# 🚀 START SERVERS - Quick Fix Guide

## 🔴 **CRITICAL ISSUE IDENTIFIED:**

**The backend server is NOT running!**

This is why you're seeing:
```
api.ts:75 Network error: XMLHttpRequest
Making POST request to /auth/register/phone
```

## ✅ **SOLUTION - Start Both Servers:**

### Step 1: Start Backend Server

Open a **NEW terminal** and run:
```bash
cd backend
npm run dev
```

**Expected Output:**
```
✓ Database connection established successfully
✓ Server running on port 5000
```

### Step 2: Verify Frontend is Running

The frontend appears to be running (you're seeing the page), but verify:
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in xxx ms
➜ Local: http://localhost:3001/
```

## 🧪 **Test After Starting Backend:**

1. **Refresh your browser** (http://localhost:3001)
2. **Go to registration page**
3. **Try registering** - should work now!

## 📊 **Expected Clean Console After Fix:**

```
Making POST request to /auth/register/phone
✓ Registration successful!
```

## 🔍 **How to Verify Servers Are Running:**

### Check Backend:
Open browser to: http://localhost:5000/health

Should see:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Check Frontend:
Already visible at: http://localhost:3001

## ⚠️ **Common Issues:**

### Issue 1: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 2: MongoDB Connection Error
```
Database health check failed
```
**Solution:** Check your MongoDB Atlas password in `backend/.env`

### Issue 3: Dependencies Not Installed
```
Error: Cannot find module
```
**Solution:**
```bash
cd backend && npm install
cd frontend && npm install
```

## 🎯 **Quick Start Commands:**

### Terminal 1 (Backend):
```bash
cd C:\Users\Admin\OneDrive\Documents\FLEKIT\backend
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd C:\Users\Admin\OneDrive\Documents\FLEKIT\frontend
npm run dev
```

## ✅ **Success Indicators:**

**Backend Running:**
- ✅ Console shows "Server running on port 5000"
- ✅ http://localhost:5000/health returns JSON

**Frontend Running:**
- ✅ Console shows "Local: http://localhost:3001"
- ✅ Page loads in browser

**Both Working Together:**
- ✅ No network errors in console
- ✅ Registration form submits successfully
- ✅ Clean console output

## 🎉 **After Starting Backend:**

The console errors will be **completely resolved**:
- ✅ No more network errors
- ✅ Registration will work
- ✅ Clean, professional console
- ✅ Full functionality restored

**Current Status:** Backend not running → Start it now!
**Expected Time:** 30 seconds to start
**Result:** All errors fixed! 🚀