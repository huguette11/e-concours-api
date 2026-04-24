-- AlterTable
ALTER TABLE "candidat" ADD COLUMN     "choix_notification" VARCHAR(10) NOT NULL DEFAULT 'SMS',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "type_candidat" DROP DEFAULT;
