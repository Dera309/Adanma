const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        roles: true,
        createdAt: true
      }
    });
    
    console.log('Existing users:', users);
    
    if (users.length > 0) {
      console.log('\nTo clear the database, run:');
      console.log('node clear-users.js');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();