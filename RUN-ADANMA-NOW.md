# 🚀 Run Adanma in Browser - Step by Step

## Quick Start (2 Steps)

### Step 1: Start Backend Server
**Option A: Use Batch File (Easiest)**
```
Double-click: start-backend.bat
```

**Option B: Manual Command**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
✓ Database connection established successfully
✓ Database health check passed
✓ MongoDB Atlas connection is working properly
✓ Server running on port 5000
```

### Step 2: Start Frontend Server
**Open a NEW terminal/command prompt**

**Option A: Use Batch File (Easiest)**
```
Double-click: start-frontend.bat
```

**Option B: Manual Command**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 3: Open in Browser
```
http://localhost:3000
```

## 🎯 What You'll See

1. **Loading Screen**: Beautiful Adanma loading animation
2. **Registration/Login Page**: Choose how to sign up
3. **Features Available**:
   - Email registration
   - Phone registration  
   - Social login (Facebook, WhatsApp)
   - Address management for 6 African countries
   - Vendor verification system

## 🔧 If Something Goes Wrong

### Backend Issues
**Problem**: Backend won't start
**Solution**: 
```bash
cd backend
npm install
npm run dev
```

### Frontend Issues  
**Problem**: Frontend won't start
**Solution**:
```bash
cd frontend
npm install
npm run dev
```

### Port Already in Use
**Problem**: "Port 3000 already in use"
**Solution**:
```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

## 🌐 Access Points

Once running:
- **Adanma App**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Development Dashboard**: Open `index.html` in browser

## 🎉 Success Indicators

**Backend Running:**
- ✅ "Server running on port 5000"
- ✅ "Database health check passed"

**Frontend Running:**
- ✅ "Local: http://localhost:3000"
- ✅ Browser shows Adanma loading screen

**Both Working:**
- ✅ Registration page loads
- ✅ No console errors
- ✅ Can interact with forms

---

**🚀 Ready to test Adanma? Start both servers and open http://localhost:3000!**