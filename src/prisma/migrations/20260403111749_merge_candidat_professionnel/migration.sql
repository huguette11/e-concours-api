/*
  Warnings:

  - The primary key for the `admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `role` column on the `admin` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `candidat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `statut_compte` column on the `candidat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `concours` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_admin` column on the `concours` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `document` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `examen` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `type_examen` column on the `examen` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `inscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `paiement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `candidat_professionnel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `passer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id_admin` on the `admin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `date_creation` on table `admin` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id_candidat` on the `candidat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sexe` to the `candidat` table without a default value. This is not possible if the table is not empty.
  - Made the column `date_creation` on table `candidat` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `annee` to the `concours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_postes` to the `concours` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id_concours` on the `concours` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `concours` table without a default value. This is not possible if the table is not empty.
  - Made the column `statut_concours` on table `concours` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id_document` on the `document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `date_upload` on table `document` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id_candidat` on the `document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `intitule` to the `examen` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id_examen` on the `examen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_concours` on the `examen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_inscription` on the `inscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `date_inscription` on table `inscription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `statut_inscription` on table `inscription` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id_candidat` on the `inscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_concours` on the `inscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_paiement` on the `paiement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `date_paiement` on table `paiement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `statut_paiement` on table `paiement` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id_inscription` on the `paiement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleAdmin" AS ENUM ('SUPERADMIN', 'GESTIONNAIRE');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "TypeConcours" AS ENUM ('DIRECT', 'PROFESSIONNEL', 'HANDICAPE');

-- CreateEnum
CREATE TYPE "TypeExamen" AS ENUM ('ECRIT', 'ORAL', 'QCM', 'SPORTIF');

-- CreateEnum
CREATE TYPE "TypeCandidat" AS ENUM ('DIRECT', 'PROFESSIONNEL');

-- DropForeignKey
ALTER TABLE "candidat_professionnel" DROP CONSTRAINT "candidat_professionnel_id_candidat_fkey";

-- DropForeignKey
ALTER TABLE "concours" DROP CONSTRAINT "concours_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_id_candidat_fkey";

-- DropForeignKey
ALTER TABLE "examen" DROP CONSTRAINT "examen_id_concours_fkey";

-- DropForeignKey
ALTER TABLE "inscription" DROP CONSTRAINT "inscription_id_candidat_fkey";

-- DropForeignKey
ALTER TABLE "inscription" DROP CONSTRAINT "inscription_id_concours_fkey";

-- DropForeignKey
ALTER TABLE "paiement" DROP CONSTRAINT "paiement_id_inscription_fkey";

-- DropForeignKey
ALTER TABLE "passer" DROP CONSTRAINT "passer_id_candidat_fkey";

-- DropForeignKey
ALTER TABLE "passer" DROP CONSTRAINT "passer_id_examen_fkey";

-- AlterTable
ALTER TABLE "admin" DROP CONSTRAINT "admin_pkey",
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id_admin",
ADD COLUMN     "id_admin" UUID NOT NULL,
ALTER COLUMN "mot_de_passe" SET DATA TYPE VARCHAR(255),
DROP COLUMN "role",
ADD COLUMN     "role" "RoleAdmin" NOT NULL DEFAULT 'GESTIONNAIRE',
ALTER COLUMN "date_creation" SET NOT NULL,
ADD CONSTRAINT "admin_pkey" PRIMARY KEY ("id_admin");

-- AlterTable
ALTER TABLE "candidat" DROP CONSTRAINT "candidat_pkey",
ADD COLUMN     "emploi" VARCHAR(150),
ADD COLUMN     "matricule" VARCHAR(100),
ADD COLUMN     "ministere" VARCHAR(150),
ADD COLUMN     "type_candidat" "TypeCandidat" NOT NULL DEFAULT 'DIRECT',
DROP COLUMN "id_candidat",
ADD COLUMN     "id_candidat" UUID NOT NULL,
DROP COLUMN "sexe",
ADD COLUMN     "sexe" "Sexe" NOT NULL,
ALTER COLUMN "mot_de_passe" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "recepisse" SET DATA TYPE VARCHAR(500),
DROP COLUMN "statut_compte",
ADD COLUMN     "statut_compte" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
ALTER COLUMN "date_creation" SET NOT NULL,
ADD CONSTRAINT "candidat_pkey" PRIMARY KEY ("id_candidat");

-- AlterTable
ALTER TABLE "concours" DROP CONSTRAINT "concours_pkey",
ADD COLUMN     "annee" INTEGER NOT NULL,
ADD COLUMN     "nombre_postes" INTEGER NOT NULL,
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" UUID NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeConcours" NOT NULL,
ALTER COLUMN "statut_concours" SET NOT NULL,
DROP COLUMN "id_admin",
ADD COLUMN     "id_admin" UUID,
ADD CONSTRAINT "concours_pkey" PRIMARY KEY ("id_concours");

-- AlterTable
ALTER TABLE "document" DROP CONSTRAINT "document_pkey",
DROP COLUMN "id_document",
ADD COLUMN     "id_document" UUID NOT NULL,
ALTER COLUMN "fichier" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "date_upload" SET NOT NULL,
DROP COLUMN "id_candidat",
ADD COLUMN     "id_candidat" UUID NOT NULL,
ADD CONSTRAINT "document_pkey" PRIMARY KEY ("id_document");

-- AlterTable
ALTER TABLE "examen" DROP CONSTRAINT "examen_pkey",
ADD COLUMN     "coefficient" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "intitule" VARCHAR(200) NOT NULL,
DROP COLUMN "id_examen",
ADD COLUMN     "id_examen" UUID NOT NULL,
DROP COLUMN "type_examen",
ADD COLUMN     "type_examen" "TypeExamen" NOT NULL DEFAULT 'ECRIT',
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" UUID NOT NULL,
ADD CONSTRAINT "examen_pkey" PRIMARY KEY ("id_examen");

-- AlterTable
ALTER TABLE "inscription" DROP CONSTRAINT "inscription_pkey",
DROP COLUMN "id_inscription",
ADD COLUMN     "id_inscription" UUID NOT NULL,
ALTER COLUMN "date_inscription" SET NOT NULL,
ALTER COLUMN "statut_inscription" SET NOT NULL,
DROP COLUMN "id_candidat",
ADD COLUMN     "id_candidat" UUID NOT NULL,
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" UUID NOT NULL,
ADD CONSTRAINT "inscription_pkey" PRIMARY KEY ("id_inscription");

-- AlterTable
ALTER TABLE "paiement" DROP CONSTRAINT "paiement_pkey",
DROP COLUMN "id_paiement",
ADD COLUMN     "id_paiement" UUID NOT NULL,
ALTER COLUMN "date_paiement" SET NOT NULL,
ALTER COLUMN "statut_paiement" SET NOT NULL,
DROP COLUMN "id_inscription",
ADD COLUMN     "id_inscription" UUID NOT NULL,
ADD CONSTRAINT "paiement_pkey" PRIMARY KEY ("id_paiement");

-- DropTable
DROP TABLE "candidat_professionnel";

-- DropTable
DROP TABLE "passer";

-- CreateTable
CREATE TABLE "resultat" (
    "id_candidat" UUID NOT NULL,
    "id_examen" UUID NOT NULL,
    "note" DECIMAL(5,2),
    "moyenne_generale" DECIMAL(5,2),
    "statut" VARCHAR(50),

    CONSTRAINT "resultat_pkey" PRIMARY KEY ("id_candidat","id_examen")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscription_id_candidat_id_concours_key" ON "inscription"("id_candidat", "id_concours");

-- AddForeignKey
ALTER TABLE "concours" ADD CONSTRAINT "concours_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "admin"("id_admin") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examen" ADD CONSTRAINT "examen_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_id_inscription_fkey" FOREIGN KEY ("id_inscription") REFERENCES "inscription"("id_inscription") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resultat" ADD CONSTRAINT "resultat_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resultat" ADD CONSTRAINT "resultat_id_examen_fkey" FOREIGN KEY ("id_examen") REFERENCES "examen"("id_examen") ON DELETE CASCADE ON UPDATE NO ACTION;
