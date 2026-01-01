# MongoDB Atlas Setup for Adanma

## Quick Setup Guide

### 1. Get Your MongoDB Atlas Connection String

1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com
   - Sign in with your account

2. **Find Your Cluster**
   - You should see your cluster: `cluster0.qye6pxs.mongodb.net`
   - Click "Connect" button

3. **Get Connection String**
   - Choose "Connect your application"
   - Select "Node.js" as driver
   - Copy the connection string

### 2. Update Your Password

Your current connection details:
- **Username**: `chideraobia7_db_user`
- **Cluster**: `cluster0.qye6pxs.mongodb.net`
- **Database**: `adanma_db` (updated for the new app name)

### 3. Configure Adanma

**Option 1: Update backend/.env directly**
```env
DATABASE_URL="mongodb+srv://chideraobia7_db_user:YOUR_ACTUAL_PASSWORD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority"
```

**Option 2: Use environment variables**
```env
DB_NAME=adanma_db
DB_USER=chideraobia7_db_user
DB_PASSWORD=your_actual_password
DB_CLUSTER=cluster0.qye6pxs.mongodb.net
DATABASE_URL="mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority"
```

### 4. Test Connection

After updating your password, test the connection:

```bash
cd backend
npm run dev
```

You should see:
```
✓ Connected to MongoDB Atlas
✓ Database: adanma_db
✓ Server running on port 5000
```

### 5. Troubleshooting

**Problem: "Authentication failed"**
- Check your password is correct
- Make sure there are no special characters that need URL encoding

**Problem: "Network timeout"**
- Check your IP is whitelisted in MongoDB Atlas
- Go to Network Access → Add IP Address → Add Current IP

**Problem: "Database not found"**
- The database `adanma_db` will be created automatically when you first insert data
- No need to create it manually

### 6. MongoDB Atlas Dashboard

**Useful MongoDB Atlas features:**
- **Collections**: View your data (users, addresses, sessions, etc.)
- **Metrics**: Monitor database performance
- **Backup**: Automatic backups are enabled
- **Network Access**: Manage IP whitelist
- **Database Access**: Manage users and permissions

### 7. Production Considerations

For production deployment:
1. **Create a production cluster** (separate from development)
2. **Use a strong password** (generate a new one)
3. **Restrict IP access** (don't use 0.0.0.0/0)
4. **Enable backup** (should be enabled by default)
5. **Monitor usage** (set up alerts for storage/bandwidth)

### 8. Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>/<database>?<options>
```

**Your specific format:**
```
mongodb+srv://chideraobia7_db_user:PASSWORD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority
```

**Replace `PASSWORD` with your actual MongoDB Atlas password!**

---

## Quick Commands

**Check connection:**
```bash
cd backend
node -e "require('dotenv').config(); console.log('DB URL:', process.env.DATABASE_URL)"
```

**Test database:**
```bash
cd backend
npm run dev
# Look for "Connected to MongoDB" message
```

**Generate Prisma client:**
```bash
cd backend
npx prisma generate
```

**View database schema:**
```bash
cd backend
npx prisma studio
# Opens web interface at http://localhost:5555
```