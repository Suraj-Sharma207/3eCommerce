import { PrismaClient } from '@prisma/client';
import adminRepository from './src/repositories/adminRepository.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing getDashboardMetrics...');
    const result = await adminRepository.getDashboardMetrics('7d');
    console.log('Success!');
  } catch (error) {
    console.error('ERROR in getDashboardMetrics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
