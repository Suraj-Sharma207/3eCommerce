import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.emailLog.deleteMany({
    where: { idempotencyKey: 'order-confirm-mock-order-id-123' }
  });
  console.log(`Deleted ${deleted.count} polluted mock email logs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
