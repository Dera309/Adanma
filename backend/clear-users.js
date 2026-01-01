const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    // Delete all users and related data
    await prisma.session.deleteMany();
    await prisma.address.deleteMany();
    await prisma.passwordHistory.deleteMany();
    await prisma.verificationRequest.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ All users and related data cleared from database');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();