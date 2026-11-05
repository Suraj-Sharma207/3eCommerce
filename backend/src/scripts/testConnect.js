import prisma from "../lib/prisma.js";

async function testConnect() {
  console.log("Testing connection times...");
  try {
    const startConnect = performance.now();
    await prisma.$connect();
    const endConnect = performance.now();
    console.log(
      `Prisma $connect() took: ${(endConnect - startConnect).toFixed(2)}ms`,
    );

    const startQuery1 = performance.now();
    await prisma.product.count();
    const endQuery1 = performance.now();
    console.log(
      `Prisma count query 1 took: ${(endQuery1 - startQuery1).toFixed(2)}ms`,
    );

    const startQuery2 = performance.now();
    await prisma.product.count();
    const endQuery2 = performance.now();
    console.log(
      `Prisma count query 2 took: ${(endQuery2 - startQuery2).toFixed(2)}ms`,
    );
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnect();
