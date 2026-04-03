-- AlterTable
ALTER TABLE "candidat" ADD COLUMN     "otp" VARCHAR(10),
ADD COLUMN     "otp_expiration" TIMESTAMP(3);
