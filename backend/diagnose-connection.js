// Simple MongoDB connection diagnostic
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 MongoDB Atlas Connection Diagnostic');
console.log('=====================================\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
    
    if (dbUrlMatch) {
        const dbUrl = dbUrlMatch[1];
        console.log('✅ Found DATABASE_URL in .env file');
        
        // Parse connection string
        const urlMatch = dbUrl.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
        if (urlMatch) {
            const [, username, password, cluster, database] = urlMatch;
            console.log('📋 Connection Details:');
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password.replace(/./g, '*')}`);
            console.log(`   Cluster: ${cluster}`);
            console.log(`   Database: ${database}`);
            console.log('');
            
            console.log('🔧 Troubleshooting Checklist:');
            console.log('');
            console.log('1. IP Address Whitelist:');
            console.log('   - Go to https://cloud.mongodb.com/');
            console.log('   - Navigate to Network Access');
            console.log('   - Add your current IP address');
            console.log('   - Or temporarily use 0.0.0.0/0 for testing');
            console.log('');
            console.log('2. Cluster Status:');
            console.log('   - Go to Database section in MongoDB Atlas');
            console.log('   - Make sure cluster is ACTIVE (not paused)');
            console.log('   - If paused, click Resume');
            console.log('');
            console.log('3. Database User:');
            console.log('   - Go to Database Access in MongoDB Atlas');
            console.log(`   - Verify user "${username}" exists and is active`);
            console.log('   - Check if password is correct');
            console.log('');
            console.log('4. Get Your IP Address:');
            console.log('   - Visit: https://whatismyipaddress.com/');
            console.log('   - Copy the IP address shown');
            console.log('   - Add it to MongoDB Atlas Network Access');
            console.log('');
        }
    } else {
        console.log('❌ Could not parse DATABASE_URL');
    }
} else {
    console.log('❌ .env file not found');
}

console.log('🚀 Next Steps:');
console.log('1. Complete the checklist above');
console.log('2. Run: npm run dev');
console.log('3. Look for "Database connection established successfully"');
console.log('');