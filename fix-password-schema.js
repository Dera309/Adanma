const { execSync } = require('child_process');

console.log('🔧 Fixing Password Schema Issue');
console.log('===============================\n');

try {
  // Change to backend directory
  process.chdir('./backend');
  console.log('✓ Changed to backend directory');

  // Generate Prisma client with updated schema
  console.log('Step 1: Generating Prisma client with passwordHash field...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma client generated successfully');

  // Push database schema changes
  console.log('\nStep 2: Updating database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✓ Database schema updated successfully');

  console.log('\n✅ SUCCESS! Password schema fixed.');
  console.log('\nThe critical passwordHash field has been added to the database.');
  console.log('Your authentication should now work properly.');
  console.log('\nRestart your backend server to apply the changes.');

} catch (error) {
  console.error('❌ Error fixing schema:', error.message);
  console.log('\n💡 Manual fix needed:');
  console.log('1. Stop the backend server');
  console.log('2. Run: cd backend');
  console.log('3. Run: npx prisma generate');
  console.log('4. Run: npx prisma db push');
  console.log('5. Restart the backend server');
  process.exit(1);
}