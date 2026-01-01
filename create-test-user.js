const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'obia.colin.100@gmail.com',
        passwordHash: hashedPassword,
        roles: 'buyer',
        emailVerified: true,
        phoneVerified: false,
        verificationStatus: 'verified',
        authProvider: 'email'
      }
    });
    
    console.log('✅ Test user created:', user.email);
    console.log('📧 Email: obia.colin.100@gmail.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ User already exists');
      
      // Update password for existing user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { email: 'obia.colin.100@gmail.com' },
        data: { passwordHash: hashedPassword }
      });
      console.log('🔑 Password updated to: password123');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();