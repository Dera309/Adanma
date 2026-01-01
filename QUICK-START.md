# Quick Start Guide - Adanma

## 🚀 Get Started in 3 Steps

### Step 1: Check System Status
Double-click `check-status.bat` to verify your system is ready.

### Step 2: Install Dependencies
Double-click `setup.bat` to install all required packages.

### Step 3: Start the Application
1. Double-click `start-backend.bat` (keep this window open)
2. Double-click `start-frontend.bat` (keep this window open)
3. Open browser to http://localhost:3000

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Node.js installed (v18 or higher)
- ✅ Internet connection
- ✅ MongoDB Atlas account with connection string

## ⚙️ Configuration

### Update MongoDB Connection (Required!)

1. Open `backend/.env` in a text editor
2. Find this line:
   ```
   DATABASE_URL="mongodb+srv://chideraobia7_db_user:your_password_here@cluster0.qye6pxs.mongodb.net/african_ecommerce?retryWrites=true&w=majority"
   ```
3. Replace `your_password_here` with your actual MongoDB Atlas password
4. Save the file

### Get Your MongoDB Password

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Click "Database Access" in the left sidebar
4. Find your user and click "Edit"
5. Copy or reset your password
6. Update the `backend/.env` file

## 🎯 Available Scripts

| Script | Purpose |
|--------|---------|
| `check-status.bat` | Check if system is ready |
| `setup.bat` | Install all dependencies |
| `start-backend.bat` | Start backend server (port 5000) |
| `start-frontend.bat` | Start frontend server (port 3000) |

## 🌐 Access Points

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔧 Troubleshooting

### Problem: "npm install" fails

**Solution 1**: Check internet connection
```bash
ping registry.npmjs.org
```

**Solution 2**: Clear npm cache and retry
```bash
npm cache clean --force
```
Then run `setup.bat` again.

### Problem: "Port already in use"

**Solution**: Find and kill the process
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Problem: Backend won't start - Database error

**Solution**: Check your MongoDB connection
1. Verify DATABASE_URL in `backend/.env` is correct
2. Make sure your MongoDB Atlas cluster is running
3. Check if your IP is whitelisted in MongoDB Atlas:
   - Go to Network Access
   - Add your current IP or use 0.0.0.0/0 for testing

### Problem: "Cannot load scripts" error

**Solution**: Enable PowerShell scripts
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type 'Y' and press Enter

## 📱 Testing the Application

### 1. Register a New User
1. Go to http://localhost:3000
2. Click "Register"
3. Choose "Email Registration"
4. Fill in your details
5. Check backend terminal for verification email log

### 2. Test Authentication
- Try logging in with your credentials
- Test password reset flow
- Try social authentication (if configured)

### 3. Test Features
- Update your profile
- Add addresses for different countries
- Test role selection (Buyer/Vendor)
- If vendor, try verification request

## 🐛 Common Issues

### Backend starts but shows database errors
- Check MongoDB connection string
- Verify MongoDB Atlas cluster is running
- Check if IP is whitelisted

### Frontend shows "Network Error"
- Make sure backend is running on port 5000
- Check `frontend/.env` has correct API URL
- Try accessing http://localhost:5000/health directly

### Changes not reflecting
- Stop both servers (Ctrl+C)
- Clear browser cache
- Restart both servers

## 📚 Additional Resources

- Full deployment guide: See `DEPLOYMENT.md`
- Detailed documentation: See `.kiro/specs/african-ecommerce-webapp/`
- API documentation: http://localhost:5000/api-docs (when running)

## 🆘 Still Having Issues?

1. Run `check-status.bat` to see what's wrong
2. Check both terminal windows for error messages
3. Review `START-APP.md` for detailed troubleshooting
4. Make sure all environment variables are set correctly

## 🎉 Success!

If you see:
- Backend: "Server running on port 5000"
- Frontend: "Local: http://localhost:3000"

You're all set! Open http://localhost:3000 in your browser and start using the application.
