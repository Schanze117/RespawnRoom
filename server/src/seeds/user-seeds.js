import User from '../models/users.js';
import bcrypt from 'bcryptjs';

export const seedUsers = async () => {
  try {
    // Delete all existing users to avoid duplicates
    await User.deleteMany({});

    // Create a test user account
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const testUser = {
      userName: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      savedGames: [],
      categoryTokens: {},
      lastTokenDecay: new Date(),
      friends: [],
      friendRequests: [],
      status: 'Online',
      lastSeen: new Date()
    };

    // Insert the test user
    await User.create(testUser);
    console.log('✅ Test user created successfully');
    console.log('👤 Username: testuser');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: testpassword123');
    
  } catch (err) {
    console.error('❌ Error seeding users:', err);
  }
};