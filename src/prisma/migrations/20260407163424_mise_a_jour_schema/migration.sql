/*
  Warnings:

  - The primary key for the `concours` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_concours` column on the `concours` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `document` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_document` column on the `document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `examen` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_examen` column on the `examen` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `inscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_inscription` column on the `inscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `paiement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id_paiement` column on the `paiement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `resultat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id_concours` on the `examen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_concours` on the `inscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_inscription` on the `paiement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id_examen` on the `resultat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "examen" DROP CONSTRAINT "examen_id_concours_fkey";

-- DropForeignKey
ALTER TABLE "inscription" DROP CONSTRAINT "inscription_id_concours_fkey";

-- DropForeignKey
ALTER TABLE "paiement" DROP CONSTRAINT "paiement_id_inscription_fkey";

-- DropForeignKey
ALTER TABLE "resultat" DROP CONSTRAINT "resultat_id_examen_fkey";

-- AlterTable
ALTER TABLE "concours" DROP CONSTRAINT "concours_pkey",
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" SERIAL NOT NULL,
ADD CONSTRAINT "concours_pkey" PRIMARY KEY ("id_concours");

-- AlterTable
ALTER TABLE "document" DROP CONSTRAINT "document_pkey",
DROP COLUMN "id_document",
ADD COLUMN     "id_document" SERIAL NOT NULL,
ADD CONSTRAINT "document_pkey" PRIMARY KEY ("id_document");

-- AlterTable
ALTER TABLE "examen" DROP CONSTRAINT "examen_pkey",
DROP COLUMN "id_examen",
ADD COLUMN     "id_examen" SERIAL NOT NULL,
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" INTEGER NOT NULL,
ADD CONSTRAINT "examen_pkey" PRIMARY KEY ("id_examen");

-- AlterTable
ALTER TABLE "inscription" DROP CONSTRAINT "inscription_pkey",
DROP COLUMN "id_inscription",
ADD COLUMN     "id_inscription" SERIAL NOT NULL,
DROP COLUMN "id_concours",
ADD COLUMN     "id_concours" INTEGER NOT NULL,
ADD CONSTRAINT "inscription_pkey" PRIMARY KEY ("id_inscription");

-- AlterTable
ALTER TABLE "paiement" DROP CONSTRAINT "paiement_pkey",
DROP COLUMN "id_paiement",
ADD COLUMN     "id_paiement" SERIAL NOT NULL,
DROP COLUMN "id_inscription",
ADD COLUMN     "id_inscription" INTEGER NOT NULL,
ADD CONSTRAINT "paiement_pkey" PRIMARY KEY ("id_paiement");

-- AlterTable
ALTER TABLE "resultat" DROP CONSTRAINT "resultat_pkey",
DROP COLUMN "id_examen",
ADD COLUMN     "id_examen" INTEGER NOT NULL,
ADD CONSTRAINT "resultat_pkey" PRIMARY KEY ("id_candidat", "id_examen");

-- CreateTable
CREATE TABLE "centre" (
    "id_centre" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "centre_pkey" PRIMARY KEY ("id_centre")
);

-- CreateTable
CREATE TABLE "ConcoursCentre" (
    "id" SERIAL NOT NULL,
    "concoursId" INTEGER NOT NULL,
    "centreId" INTEGER NOT NULL,

    CONSTRAINT "ConcoursCentre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConcoursCentre_concoursId_centreId_key" ON "ConcoursCentre"("concoursId", "centreId");

-- CreateIndex
CREATE UNIQUE INDEX "inscription_id_candidat_id_concours_key" ON "inscription"("id_candidat", "id_concours");

-- AddForeignKey
ALTER TABLE "ConcoursCentre" ADD CONSTRAINT "ConcoursCentre_concoursId_fkey" FOREIGN KEY ("concoursId") REFERENCES "concours"("id_concours") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcoursCentre" ADD CONSTRAINT "ConcoursCentre_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centre"("id_centre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examen" ADD CONSTRAINT "examen_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_id_inscription_fkey" FOREIGN KEY ("id_inscription") REFERENCES "inscription"("id_inscription") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resultat" ADD CONSTRAINT "resultat_id_examen_fkey" FOREIGN KEY ("id_examen") REFERENCES "examen"("id_examen") ON DELETE CASCADE ON UPDATE NO ACTION;
