-- CreateTable
CREATE TABLE "lieuxComposition" (
    "id_lieux" SERIAL NOT NULL,
    "nom" VARCHAR(250) NOT NULL,
    "id_centre" INTEGER NOT NULL,
    "quota" INTEGER NOT NULL,

    CONSTRAINT "lieuxComposition_pkey" PRIMARY KEY ("id_lieux")
);

-- CreateTable
CREATE TABLE "composer" (
    "id_composer" SERIAL NOT NULL,
    "id_candidat" UUID NOT NULL,
    "id_concours" INTEGER NOT NULL,
    "id_lieux" INTEGER NOT NULL,

    CONSTRAINT "composer_pkey" PRIMARY KEY ("id_composer")
);

-- CreateIndex
CREATE UNIQUE INDEX "composer_id_candidat_id_concours_key" ON "composer"("id_candidat", "id_concours");

-- AddForeignKey
ALTER TABLE "lieuxComposition" ADD CONSTRAINT "lieuxComposition_id_centre_fkey" FOREIGN KEY ("id_centre") REFERENCES "centre"("id_centre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composer" ADD CONSTRAINT "composer_id_candidat_fkey" FOREIGN KEY ("id_candidat") REFERENCES "candidat"("id_candidat") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composer" ADD CONSTRAINT "composer_id_concours_fkey" FOREIGN KEY ("id_concours") REFERENCES "concours"("id_concours") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composer" ADD CONSTRAINT "composer_id_lieux_fkey" FOREIGN KEY ("id_lieux") REFERENCES "lieuxComposition"("id_lieux") ON DELETE CASCADE ON UPDATE CASCADE;
