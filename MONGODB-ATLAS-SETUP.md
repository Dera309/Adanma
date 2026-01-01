# MongoDB Atlas Setup Guide for Adanma

## 🚨 Current Issue

**Error:** `Server selection timeout: No available servers`

**Cause:** The MongoDB Atlas connection is failing because:
1. ❌ Password is still set to `your_password_here`
2. ❌ IP address might not be whitelisted
3. ❌ Cluster might be paused

## 🔧 Step-by-Step Fix

### Step 1: Get Your MongoDB Atlas Password

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Sign in with your account

2. **Access Database Users**
   - Click "Database Access" in the left sidebar
   - Find user: `chideraobia7_db_user`

3. **Get/Reset Password**
   - Click "Edit" next to your user
   - Either copy existing password or click "Edit Password" to create new one
   - **IMPORTANT:** Copy the password exactly (no extra spaces)

### Step 2: Update Your .env File

1. **Open:** `backend/.env`
2. **Find this line:**
   ```env
   DATABASE_URL="mongodb+srv://chideraobia7_db_user:your_password_here@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority"
   ```
3. **Replace `your_password_here` with your actual password:**
   ```env
   DATABASE_URL="mongodb+srv://chideraobia7_db_user:YOUR_ACTUAL_PASSWORD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority"
   ```

### Step 3: Whitelist Your IP Address

1. **In MongoDB Atlas Dashboard**
   - Click "Network Access" in the left sidebar

2. **Add Your IP**
   - Click "Add IP Address"
   - Click "Add Current IP Address" 
   - OR use `0.0.0.0/0` for testing (allows all IPs)

3. **Save Changes**
   - Click "Confirm"
   - Wait for the status to show "Active"

### Step 4: Check Cluster Status

1. **Go to Clusters**
   - Click "Database" in the left sidebar
   - Make sure your cluster shows "Active" (not "Paused")

2. **If Paused**
   - Click "Resume" to activate the cluster
   - Wait for it to become active

### Step 5: Test Connection

```bash
cd backend
npm run dev
```

**Expected Success Output:**
```
✓ Database connection established successfully
✓ Database health check passed
✓ MongoDB Atlas connection is working properly
✓ Server running on port 5000
```

## 🔍 Troubleshooting

### Issue: Authentication Failed
```
MongoServerError: bad auth: Authentication failed
```
**Solution:** Wrong password in DATABASE_URL
- Double-check password in MongoDB Atlas
- Make sure no extra spaces in .env file
- Try resetting password in MongoDB Atlas

### Issue: Network Timeout
```
Server selection timeout: No available servers
```
**Solution:** IP not whitelisted
- Add your IP in Network Access
- Or use 0.0.0.0/0 for testing
- Check if cluster is paused

### Issue: Connection String Format
```
Invalid connection string
```
**Solution:** Check URL format
- Make sure no spaces in the connection string
- Verify username and cluster name are correct
- Check for special characters in password (may need URL encoding)

## 🛠️ Quick Test Commands

**Test connection without starting server:**
```bash
cd backend
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Testing connection...');
prisma.\$runCommandRaw({ ping: 1 })
  .then(() => console.log('✅ SUCCESS: MongoDB connection works!'))
  .catch(err => {
    console.error('❌ FAILED:', err.message);
    if (err.message.includes('authentication')) {
      console.log('💡 Check your password in .env file');
    } else if (err.message.includes('timeout')) {
      console.log('💡 Check Network Access in MongoDB Atlas');
    }
  })
  .finally(() => prisma.\$disconnect());
"
```

**Check environment variables:**
```bash
cd backend
node -e "
require('dotenv').config();
const url = process.env.DATABASE_URL;
if (url.includes('your_password_here')) {
  console.log('❌ Password not set! Update .env file');
} else {
  console.log('✅ Password appears to be set');
}
console.log('DB URL (masked):', url.replace(/:[^:@]*@/, ':***@'));
"
```

## 📋 MongoDB Atlas Checklist

- [ ] **Cluster Status:** Active (not paused)
- [ ] **Database User:** `chideraobia7_db_user` exists
- [ ] **Password:** Set correctly in `backend/.env`
- [ ] **Network Access:** Your IP is whitelisted
- [ ] **Database Name:** `adanma_db` (will be created automatically)
- [ ] **Connection String:** No typos or extra spaces

## 🎯 Common Password Issues

### Special Characters in Password
If your password has special characters, you might need to URL encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`

### Example:
If password is `MyPass@123`, use `MyPass%40123` in the connection string.

## 🚀 Quick Fix Script

Create this file as `test-mongodb.js` in backend folder:
```javascript
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('✅ Ping successful!');
    
    console.log('🎉 MongoDB Atlas is working perfectly!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 SOLUTION: Update your password in backend/.env');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 SOLUTION: Check Network Access in MongoDB Atlas');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run with: `node test-mongodb.js`

---

## 🎉 Success Indicators

When everything is working:
1. ✅ No authentication errors
2. ✅ "Database connection established successfully"
3. ✅ "Database health check passed"
4. ✅ Server starts on port 5000
5. ✅ No timeout errors

**Next Step:** Once MongoDB is connected, you can start the frontend and test the full Adanma application!