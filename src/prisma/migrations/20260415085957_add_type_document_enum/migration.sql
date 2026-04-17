/*
  Warnings:

  - Changed the type of `type_document` on the `document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CEP', 'BEPC', 'BEP', 'BAC', 'LICENCE', 'MASTER', 'DOCTORAT');

-- AlterTable
ALTER TABLE "document" DROP COLUMN "type_document",
ADD COLUMN     "type_document" "TypeDocument" NOT NULL;
