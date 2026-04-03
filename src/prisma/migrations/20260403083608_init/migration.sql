-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleAdmin" AS ENUM ('SUPERADMIN', 'GESTIONNAIRE');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "TypeConcours" AS ENUM ('DIRECT', 'PROFESSIONNEL', 'HANDICAPE');

-- CreateTable
CREATE TABLE "admin" (
    "id_admin" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(20),
    "role" "RoleAdmin" NOT NULL DEFAULT 'GESTIONNAIRE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id_admin")
);

-- CreateTable
CREATE TABLE "candidat" (
    "id_candidat" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "nom_jeune_fille" VARCHAR(100),
    "sexe" "Sexe" NOT NULL,
    "date_naissance" DATE NOT NULL,
    "lieu_naissance" VARCHAR(150),
    "pays_naissance" VARCHAR(150),
    "numero_cnib" VARCHAR(50) NOT NULL,
    "date_delivrance" DATE,
    "telephone" VARCHAR(20),
    "email" VARCHAR(150) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "recepisse" VARCHAR(500),
    "statut_compte" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidat_pkey" PRIMARY KEY ("id_candidat")
);

-- CreateTable
CREATE TABLE "candidat_professionnel" (
    "id_candidat" UUID NOT NULL,
    "matricule" VARCHAR(100) NOT NULL,
    "emploi" VARCHAR(150),
    "ministere" VARCHAR(150),

    CONSTRAINT "candidat_professionnel_pkey" PRIMARY KEY ("id_candidat")
);

-- CreateTable
CREATE TABLE "concours" (
    "id_concours" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "type" "TypeConcours" NOT NULL,
    "description" TEXT,
    "frais_inscription" DECIMAL(10,2) NOT NULL,
    "nombre_postes" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "statut_concours" VARCHAR(50) NOT NULL DEFAULT 'ouvert',
    "id_admin" UUID,

    CONSTRAINT "concours_pkey" PRIMARY KEY ("id_concours")
);

-- CreateTable
CREATE TABLE "document" (
    "id_document" UUID NOT NULL,
    "type_document" VARCHAR(100) NOT NULL,
    "fichier" VARCHAR(500) NOT NULL,
    "date_upload" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_candidat" UUID NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id_document")
);

-- CreateTable
CREATE TABLE "examen" (
    "id_examen" UUID NOT NULL,
    "date_examen" DATE NOT NULL,
    "heure" TIME(6),
    "lieu" VARCHAR(200),
    "type_examen" VARCHAR(50),
    "id_concours" UUID NOT NULL,

    CONSTRAINT "examen_pkey" PRIMARY KEY ("id_examen")
);

-- CreateTable
CREATE TABLE "inscription" (
    "id_inscription" UUID NOT NULL,
    "date_inscription" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut_inscription" VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    "id_candidat" UUID NOT NULL,
    "id_concours" UUID NOT NULL,

    CONSTRAINT "inscription_pkey" PRIMARY KEY ("id_inscription")
);

-- CreateTable
CREATE TABLE "paiement" (
    "id_paiement" UUID NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "date_paiement" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode_paiement" VARCHAR(50),
    "reference_transaction" VARCHAR(150),
    "statut_paiement" VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    "id_inscription" UUID NOT NULL,

    CONSTRAINT "paiement_pkey" PRIMARY KEY ("id_paiement")
);

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
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidat_numero_cnib_key" ON "candidat"("numero_cnib");

-- CreateIndex
CREATE UNIQUE INDEX "candidat_email_key" ON "candidat"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidat_professionnel_matricule_key" ON "candidat_professionnel"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "inscription_id_candidat_id_concours_key" ON "inscription"("id_candidat", "id_concours");

-- CreateIndex
CREATE UNIQUE INDEX "paiement_reference_transaction_key" ON "paiement"("reference_transaction");

-- AddForeignKey
ALTER TABLE "candidat_professionnel" ADD CONSTRAINT "candidat_professionnel_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "concours" ADD CONSTRAINT "concours_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "admin"("id_admin") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examen" ADD CONSTRAINT "examen_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE NO ACTION;

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

