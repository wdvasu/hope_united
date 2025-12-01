-- Make eSignatureName nullable and add eSignatureImage text column
ALTER TABLE "Registration" ALTER COLUMN "eSignatureName" DROP NOT NULL;
ALTER TABLE "Registration" ADD COLUMN     "eSignatureImage" TEXT;
