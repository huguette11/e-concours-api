-- CreateTable
CREATE TABLE "admin" (
    "id_admin" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "mot_de_passe" VARCHAR(100) NOT NULL,
    "telephone" VARCHAR(20),
    "role" VARCHAR(50) DEFAULT 'gestionnaire',
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id_admin")
);

-- CreateTable
CREATE TABLE "candidat" (
    "id_candidat" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "nom_jeune_fille" VARCHAR(100),
    "sexe" VARCHAR(10),
    "date_naissance" DATE NOT NULL,
    "lieu_naissance" VARCHAR(150),
    "pays_naissance" VARCHAR(150),
    "numero_cnib" VARCHAR(50) NOT NULL,
    "date_delivrance" DATE,
    "telephone" VARCHAR(20),
    "email" VARCHAR(150) NOT NULL,
    "mot_de_passe" VARCHAR(100) NOT NULL,
    "recepisse" VARCHAR(100),
    "statut_compte" VARCHAR(50) DEFAULT 'actif',
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidat_pkey" PRIMARY KEY ("id_candidat")
);

-- CreateTable
CREATE TABLE "candidat_professionnel" (
    "id_candidat" VARCHAR(50) NOT NULL,
    "matricule" VARCHAR(100) NOT NULL,
    "emploi" VARCHAR(150),
    "ministere" VARCHAR(150),

    CONSTRAINT "candidat_professionnel_pkey" PRIMARY KEY ("id_candidat")
);

-- CreateTable
CREATE TABLE "concours" (
    "id_concours" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "type" VARCHAR(50),
    "description" TEXT,
    "frais_inscription" DECIMAL(10,2) NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "statut_concours" VARCHAR(50) DEFAULT 'ouvert',
    "id_admin" VARCHAR(50),

    CONSTRAINT "concours_pkey" PRIMARY KEY ("id_concours")
);

-- CreateTable
CREATE TABLE "document" (
    "id_document" VARCHAR(50) NOT NULL,
    "type_document" VARCHAR(100) NOT NULL,
    "fichier" VARCHAR(50) NOT NULL,
    "date_upload" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_candidat" VARCHAR(50) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id_document")
);

-- CreateTable
CREATE TABLE "examen" (
    "id_examen" VARCHAR(50) NOT NULL,
    "date_examen" DATE NOT NULL,
    "heure" TIME(6),
    "lieu" VARCHAR(200),
    "type_examen" VARCHAR(50),
    "id_concours" VARCHAR(50) NOT NULL,

    CONSTRAINT "examen_pkey" PRIMARY KEY ("id_examen")
);

-- CreateTable
CREATE TABLE "inscription" (
    "id_inscription" VARCHAR(50) NOT NULL,
    "date_inscription" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "statut_inscription" VARCHAR(50) DEFAULT 'en_attente',
    "id_candidat" VARCHAR(50) NOT NULL,
    "id_concours" VARCHAR(50) NOT NULL,

    CONSTRAINT "inscription_pkey" PRIMARY KEY ("id_inscription")
);

-- CreateTable
CREATE TABLE "paiement" (
    "id_paiement" VARCHAR(50) NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "date_paiement" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "mode_paiement" VARCHAR(50),
    "reference_transaction" VARCHAR(150),
    "statut_paiement" VARCHAR(50) DEFAULT 'en_attente',
    "id_inscription" VARCHAR(50) NOT NULL,

    CONSTRAINT "paiement_pkey" PRIMARY KEY ("id_paiement")
);

-- CreateTable
CREATE TABLE "passer" (
    "id_candidat" VARCHAR(50) NOT NULL,
    "id_examen" VARCHAR(50) NOT NULL,
    "note" DECIMAL(5,2),
    "moyenne_generale" DECIMAL(5,2),
    "statut" VARCHAR(50),

    CONSTRAINT "passer_pkey" PRIMARY KEY ("id_candidat","id_examen")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidat_numero_cnib_key" ON "candidat"("numero_cnib");

-- CreateIndex
CREATE UNIQUE INDEX "candidat_email_key" ON "candidat"("email");

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
ALTER TABLE "passer" ADD CONSTRAINT "passer_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passer" ADD CONSTRAINT "passer_id_examen_fkey" FOREIGN KEY ("id_examen") REFERENCES "examen"("id_examen") ON DELETE CASCADE ON UPDATE NO ACTION;
