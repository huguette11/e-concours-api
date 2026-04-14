/*
  Warnings:

  - Made the column `lieu_naissance` on table `candidat` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pays_naissance` on table `candidat` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date_delivrance` on table `candidat` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telephone` on table `candidat` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `statut_inscription` on the `inscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'ANNULEE');

-- AlterTable
ALTER TABLE "candidat" ALTER COLUMN "lieu_naissance" SET NOT NULL,
ALTER COLUMN "pays_naissance" SET NOT NULL,
ALTER COLUMN "date_delivrance" SET NOT NULL,
ALTER COLUMN "telephone" SET NOT NULL;

-- AlterTable
ALTER TABLE "concours" ALTER COLUMN "statut_concours" SET DEFAULT 'Attente';

-- AlterTable
ALTER TABLE "inscription" DROP COLUMN "statut_inscription",
ADD COLUMN     "statut_inscription" "StatutInscription" NOT NULL;
