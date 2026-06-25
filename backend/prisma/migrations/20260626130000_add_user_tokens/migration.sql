-- AlterTable
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT,
                   ADD COLUMN "verificationExpires" TIMESTAMP(3),
                   ADD COLUMN "resetPasswordToken" TEXT,
                   ADD COLUMN "resetPasswordExpires" TIMESTAMP(3),
                   ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
