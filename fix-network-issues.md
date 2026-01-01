# MongoDB Atlas Network Issues - Fix Guide

## Current Error Analysis:
- **DNS Resolution Error**: `os error 10051` - Network unreachable
- **Host Resolution Error**: `os error 11001` - No such host is known
- **Server Selection Timeout**: Cannot connect to any MongoDB Atlas servers

## Root Causes:
1. **Firewall/Antivirus blocking connections**
2. **ISP blocking MongoDB Atlas ports**
3. **Network configuration issues**
4. **MongoDB Atlas IP whitelist not configured**

## Solutions to Try:

### 1. **Immediate Fix - Use Local Database**
✅ **DONE**: Run `switch-to-local.bat` to use SQLite temporarily

### 2. **Fix MongoDB Atlas Network Issues**

#### A. **Check Windows Firewall**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change Settings" → "Allow another app"
4. Browse to: `C:\Program Files\nodejs\node.exe`
5. Add Node.js to both Private and Public networks
6. Click OK

#### B. **Check Antivirus Software**
1. Open your antivirus software (Windows Defender, Norton, etc.)
2. Add Node.js to the exceptions/whitelist
3. Add the project folder to exceptions
4. Temporarily disable real-time protection to test

#### C. **Try Different DNS Servers**
1. Open Network Settings
2. Change DNS to:
   - Primary: `8.8.8.8` (Google DNS)
   - Secondary: `8.8.4.4`
3. Or try Cloudflare DNS: `1.1.1.1` and `1.0.0.1`

#### D. **MongoDB Atlas Configuration**
1. Go to https://cloud.mongodb.com/
2. **Network Access** → **Add IP Address**
3. Try adding: `0.0.0.0/0` (Allow from anywhere) - TEMPORARILY
4. **Database** → Make sure cluster is **Active** (not Paused)

#### E. **Test Network Connectivity**
Open Command Prompt and run:
```cmd
nslookup cluster0.qye6pxs.mongodb.net
ping cluster0.qye6pxs.mongodb.net
telnet cluster0.qye6pxs.mongodb.net 27017
```

### 3. **Alternative Connection String**
Try this in your `.env` file:
```
DATABASE_URL="mongodb+srv://chideraobia7_db_user:EMENIKE3aDD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority&ssl=true&authSource=admin&connectTimeoutMS=30000&serverSelectionTimeoutMS=30000"
```

## Quick Test Commands:
```cmd
# Test local database (should work)
switch-to-local.bat
cd backend
npm run dev

# Test MongoDB Atlas (after fixing network)
switch-to-mongodb.bat
cd backend
npm run dev
```

## Priority:
1. ✅ **Use local database NOW** (switch-to-local.bat)
2. 🔄 **Fix network issues** (try solutions A-E above)
3. 🔄 **Switch back to MongoDB Atlas** (switch-to-mongodb.bat)