/*
  Warnings:

  - Added the required column `id_centre` to the `inscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inscription" ADD COLUMN     "id_centre" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_centre_fkey" FOREIGN KEY ("id_centre") REFERENCES "centre"("id_centre") ON DELETE CASCADE ON UPDATE NO ACTION;
