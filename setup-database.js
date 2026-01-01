const { execSync } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('Setting up SQLite Database');
console.log('========================================');
console.log('');

try {
  // Change to backend directory
  process.chdir('./backend');
  console.log('✓ Changed to backend directory');

  // Generate Prisma client
  console.log('Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma client generated successfully');

  // Push database schema
  console.log('');
  console.log('Step 2: Creating SQLite database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✓ Database created successfully');

  console.log('');
  console.log('✅ SUCCESS! Database setup complete.');
  console.log('');
  console.log('You can now start the backend with: npm run dev');
  console.log('');

} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  process.exit(1);
}