# How to Start the African E-commerce Application

## Current System Status
- ✅ Node.js v24.11.1 installed
- ❌ Docker not installed
- ⚠️ PowerShell execution policy restricted
- ⚠️ Network connectivity issues with npm

## Recommended Approach: Manual Terminal Start

Since Docker is not available and there are PowerShell restrictions, the best approach is to manually start the backend and frontend in separate terminals.

### Step 1: Fix PowerShell Execution Policy (One-time setup)

Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Fix Network Issues (If needed)

If npm install fails with network errors:
1. Check your internet connection
2. Try using a different network
3. Or configure npm to use a different registry:
```bash
npm config set registry https://registry.npmjs.org/
```

### Step 3: Install Dependencies

Open a terminal in the project root and run:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Configure Environment Variables

**Backend (.env file is already configured)**
- Located at: `backend/.env`
- ⚠️ **IMPORTANT**: Update the MongoDB password in DATABASE_URL
- Current: `DATABASE_URL="mongodb+srv://chideraobia7_db_user:your_password_here@cluster0.qye6pxs.mongodb.net/african_ecommerce?retryWrites=true&w=majority"`
- Replace `your_password_here` with your actual MongoDB Atlas password

**Frontend (.env file is already configured)**
- Located at: `frontend/.env`
- Already set to connect to backend at `http://localhost:5000/api`

### Step 5: Start the Application

**Option A: Using Two Separate Terminals (Recommended)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
This will start the backend server on http://localhost:5000

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
This will start the frontend on http://localhost:3000

**Option B: Using Single Terminal with npm-run-all (If installed)**

From project root:
```bash
npm run dev
```

### Step 6: Access the Application

Once both servers are running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## Troubleshooting

### Issue: "npm install" fails with network error

**Solution 1**: Check internet connection
```bash
ping registry.npmjs.org
```

**Solution 2**: Clear npm cache
```bash
npm cache clean --force
npm install
```

**Solution 3**: Use different registry
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

### Issue: "Cannot load scripts" error

**Solution**: Enable PowerShell scripts (requires Administrator)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Backend fails to start - Database connection error

**Solution**: Update MongoDB connection string in `backend/.env`
1. Go to MongoDB Atlas dashboard
2. Get your connection string
3. Replace the DATABASE_URL in `backend/.env`
4. Make sure to replace `<password>` with your actual password

### Issue: Port already in use

**Solution**: Kill the process using the port
```bash
# For port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# For port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Module not found errors

**Solution**: Reinstall dependencies
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## Alternative: Docker Approach (Future)

If you install Docker Desktop for Windows:

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Run from project root:
```bash
docker-compose up
```

This will start all services (database, backend, frontend) automatically.

## Quick Commands Reference

```bash
# Check if services are running
curl http://localhost:5000/health  # Backend health
curl http://localhost:3000         # Frontend

# View backend logs
cd backend
npm run dev

# View frontend logs
cd frontend
npm run dev

# Stop services
# Press Ctrl+C in each terminal

# Build for production
cd backend
npm run build

cd frontend
npm run build
```

## Next Steps After Starting

1. Open browser to http://localhost:3000
2. You should see the registration/login page
3. Try registering a new user with email
4. Check backend terminal for logs
5. Test the authentication flow

## Need Help?

If you encounter issues:
1. Check both terminal windows for error messages
2. Verify MongoDB connection string is correct
3. Ensure ports 3000 and 5000 are not in use
4. Check the troubleshooting section above
