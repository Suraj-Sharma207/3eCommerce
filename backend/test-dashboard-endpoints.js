import { PrismaClient } from '@prisma/client';
import adminRepository from './src/repositories/adminRepository.js';

const prisma = new PrismaClient();

async function main() {
  const timeFilter = '7d';
  try {
    console.log('Testing getDashboardMetrics...');
    await adminRepository.getDashboardMetrics(timeFilter);
    console.log('OK');

    console.log('Testing getRevenueAnalytics...');
    await adminRepository.getRevenueAnalytics();
    console.log('OK');

    console.log('Testing getOrdersAnalytics...');
    await adminRepository.getOrdersAnalytics();
    console.log('OK');

    console.log('Testing getInventoryAlerts...');
    await adminRepository.getInventoryAlerts();
    console.log('OK');

    console.log('Testing getCustomersAnalytics...');
    await adminRepository.getCustomersAnalytics();
    console.log('OK');

    console.log('Testing getProductsAnalytics...');
    await adminRepository.getProductsAnalytics();
    console.log('OK');

    console.log('Testing getDeliveriesAnalytics...');
    await adminRepository.getDeliveriesAnalytics();
    console.log('OK');

    console.log('Testing getCancellationsAnalytics...');
    await adminRepository.getCancellationsAnalytics();
    console.log('OK');

  } catch (error) {
    console.error('TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
