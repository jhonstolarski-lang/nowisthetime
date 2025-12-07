import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  const db = drizzle(databaseUrl);
  
  const adminEmail = 'eulilizinhah@gmail.com';
  const adminPassword = 'eulilis123';
  const adminName = 'Lia Vasconcelos';
  
  try {
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existing.length > 0) {
      console.log('✅ Admin user already exists:', adminEmail);
      return;
    }
    
    // Hash password
    const passwordHash = await hashPassword(adminPassword);
    
    // Create admin user
    await db.insert(users).values({
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: 'admin',
      loginMethod: 'email',
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', adminName);
    console.log('🛡️ Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createAdmin();
