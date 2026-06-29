import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function checkBranding() {
  try {
    const records = await prisma.brandingSettings.findMany();
    console.log('--- Branding Settings in DB ---');
    console.log(`Total records: ${records.length}`);
    console.log(records);
    console.log('--------------------------------');
  } catch (error) {
    console.error('Error checking branding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranding();
