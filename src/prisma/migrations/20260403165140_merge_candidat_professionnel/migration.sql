/*
  Warnings:

  - The `type_examen` column on the `examen` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `candidat_professionnel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `intitule` to the `examen` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeExamen" AS ENUM ('ECRIT', 'ORAL', 'QCM', 'SPORTIF');

-- CreateEnum
CREATE TYPE "TypeCandidat" AS ENUM ('DIRECT', 'PROFESSIONNEL');

-- DropForeignKey
ALTER TABLE "candidat_professionnel" DROP CONSTRAINT "candidat_professionnel_id_candidat_fkey";

-- AlterTable
ALTER TABLE "candidat" ADD COLUMN     "emploi" VARCHAR(150),
ADD COLUMN     "matricule" VARCHAR(100),
ADD COLUMN     "ministere" VARCHAR(150),
ADD COLUMN     "type_candidat" "TypeCandidat" NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE "examen" ADD COLUMN     "coefficient" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "intitule" VARCHAR(200) NOT NULL,
DROP COLUMN "type_examen",
ADD COLUMN     "type_examen" "TypeExamen" NOT NULL DEFAULT 'ECRIT';

-- DropTable
DROP TABLE "candidat_professionnel";
