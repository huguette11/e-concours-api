-- AlterTable
ALTER TABLE "concours" ADD COLUMN     "categorieId" INTEGER;

-- CreateTable
CREATE TABLE "categorieConcours" (
    "id" SERIAL NOT NULL,
    "libelle" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "flgActif" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "lastModifiedBy" INTEGER,
    "lastModifiedDate" TIMESTAMP(3),

    CONSTRAINT "categorieConcours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "concours" ADD CONSTRAINT "concours_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categorieConcours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
