import prisma from "../lib/prisma.js";

export const logAudit = async ({
  adminName,
  section,
  oldValue,
  newValue,
  ipAddress,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminName,
        section,
        oldValue: oldValue || {},
        newValue: newValue || {},
        ipAddress: ipAddress || "Unknown",
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
