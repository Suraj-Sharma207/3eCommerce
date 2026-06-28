import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import { z } from 'zod';
import { hashPassword } from '../utils/bcrypt.js';
import { passwordValidation } from '../validations/authValidation.js';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Setup readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Parse arguments
const args = process.argv.slice(2);
const isInteractive = args.includes('--interactive');
const isReset = args.includes('--reset');

const emailValidation = z.string().email('Invalid email format.');

const logHeader = () => {
  console.log('\n=======================================');
  console.log('🏁 Starting Administrator Seeder');
  console.log('=======================================\n');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
};

const validateEnvVars = () => {
  const { DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } = process.env;
  if (!DEFAULT_ADMIN_NAME || !DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
    console.error('❌ Error: Missing required environment variables (DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD).');
    console.error('Please configure them in your .env file or use --interactive mode.');
    process.exit(1);
  }
  return {
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD
  };
};

const validateInputs = (name, email, password) => {
  if (!name || name.trim().length < 2) {
    console.error('❌ Error: Name must be at least 2 characters.');
    process.exit(1);
  }

  const emailParse = emailValidation.safeParse(email);
  if (!emailParse.success) {
    console.error(`❌ Error: ${emailParse.error.errors[0].message}`);
    process.exit(1);
  }

  const passwordParse = passwordValidation.safeParse(password);
  if (!passwordParse.success) {
    console.error(`❌ Error: ${passwordParse.error.errors[0].message}`);
    process.exit(1);
  }
};

const getInteractiveInputs = async () => {
  console.log('Interactive Mode Activated.\n');
  const name = await question('Enter Admin Name: ');
  const email = await question('Enter Admin Email: ');
  const password = await question('Enter Admin Password: ');
  return { name, email, password };
};

const seedAdmin = async () => {
  try {
    logHeader();

    if (isReset && process.env.NODE_ENV === 'production') {
      console.error('❌ Error: Reset mode is strictly prohibited in production.');
      process.exit(1);
    }

    let adminData = {};

    if (isInteractive) {
      adminData = await getInteractiveInputs();
    } else {
      adminData = validateEnvVars();
    }

    validateInputs(adminData.name, adminData.email, adminData.password);

    console.log('Checking existing administrator...');

    if (isReset) {
      const confirm = await question('\n⚠️ WARNING: This will delete existing administrators. Type "YES" to confirm: ');
      if (confirm.trim() !== 'YES') {
        console.log('\nReset cancelled. Status: SKIPPED\n');
        process.exit(0);
      }
      
      console.log('\nDeleting existing administrators...');
      
      await prisma.$transaction(async (tx) => {
        await tx.user.deleteMany({
          where: { role: 'ADMIN' }
        });
        
        const hashedPassword = await hashPassword(adminData.password);
        
        await tx.user.create({
          data: {
            name: adminData.name,
            email: adminData.email,
            password: hashedPassword,
            role: 'ADMIN',
            isEmailVerified: true,
            active: true
          }
        });
      });
      
      console.log('\n✅ Administrator reset successfully.');
      console.log(`Role: ADMIN\nEmail: ${adminData.email}\nStatus: RESET COMPLETED\n`);
      return;
    }

    // Normal flow
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { email: adminData.email }
        ]
      }
    });

    if (existingAdmin) {
      console.log('\n✔ Administrator already exists.');
      console.log('Status: SKIPPED\n');
      return;
    }

    console.log('\nAdministrator not found.');
    console.log('Creating administrator...');

    const hashedPassword = await hashPassword(adminData.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: 'ADMIN',
          isEmailVerified: true,
          active: true
        }
      });
    });

    console.log('\n✅ Administrator created successfully.');
    console.log(`Role: ADMIN\nEmail: ${adminData.email}\nStatus: CREATED\n`);

  } catch (error) {
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      console.log('\n✔ Administrator already exists (Unique Constraint).');
      console.log('Status: SKIPPED\n');
    } else {
      console.error('\n❌ Seeder failed:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
};

seedAdmin();
