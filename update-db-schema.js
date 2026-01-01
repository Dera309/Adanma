const { execSync } = require('child_process');

console.log('========================================');
console.log('Updating Database Schema');
console.log('========================================');
console.log('');

try {
  // Change to backend directory
  process.chdir('./backend');
  console.log('✓ Changed to backend directory');

  // Generate Prisma client
  console.log('Step 1: Generating updated Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma client generated successfully');

  // Push database schema
  console.log('');
  console.log('Step 2: Updating database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✓ Database schema updated successfully');

  console.log('');
  console.log('✅ SUCCESS! Database schema updated.');
  console.log('');
  console.log('The server should now work without the isActive errors.');
  console.log('Restart your backend server to see the changes.');
  console.log('');

} catch (error) {
  console.error('❌ Error updating schema:', error.message);
  process.exit(1);
}