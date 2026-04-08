/*
  Warnings:

  - The `statut_paiement` column on the `paiement` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "statut_concours" AS ENUM ('OUVERT', 'FERMER', 'ATTENTE');

-- CreateEnum
CREATE TYPE "statut_paiement" AS ENUM ('REUSSI', 'ECHOUE', 'ATTENTE');

-- AlterTable
ALTER TABLE "candidat" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "update_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "concours" ADD COLUMN     "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "update_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "statut_concours" SET DEFAULT 'fermé';

-- AlterTable
ALTER TABLE "examen" ADD COLUMN     "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "update_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "paiement" DROP COLUMN "statut_paiement",
ADD COLUMN     "statut_paiement" "statut_paiement" NOT NULL DEFAULT 'ATTENTE';
