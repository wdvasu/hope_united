-- CreateEnum
CREATE TYPE "VeteranStatus" AS ENUM ('YES', 'NO', 'REFUSED');

-- CreateEnum
CREATE TYPE "SexualOrientation" AS ENUM ('HETEROSEXUAL', 'GAY_LESBIAN', 'BISEXUAL', 'OTHER', 'REFUSED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'TRANSGENDER', 'NON_BINARY', 'OTHER', 'REFUSED');

-- CreateEnum
CREATE TYPE "Race" AS ENUM ('WHITE', 'BLACK_AFRICAN_AMERICAN', 'ASIAN', 'AMERICAN_INDIAN_ALASKA_NATIVE', 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER', 'OTHER', 'REFUSED');

-- CreateEnum
CREATE TYPE "Ethnicity" AS ENUM ('HISPANIC_LATINO', 'NOT_HISPANIC_LATINO', 'REFUSED');

-- CreateEnum
CREATE TYPE "County" AS ENUM ('SUMMIT', 'STARK', 'PORTAGE', 'CUYAHOGA', 'OTHER_OH_COUNTY', 'OUT_OF_STATE', 'REFUSED');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "veteranStatus" "VeteranStatus" NOT NULL,
    "drugs" TEXT[],
    "drugOther" TEXT,
    "sexualOrientation" "SexualOrientation" NOT NULL,
    "sexualOther" TEXT,
    "gender" "Gender" NOT NULL,
    "genderOther" TEXT,
    "race" "Race" NOT NULL,
    "raceOther" TEXT,
    "ethnicity" "Ethnicity" NOT NULL,
    "county" "County" NOT NULL,
    "countyOther" TEXT,
    "waiverAgreed" BOOLEAN NOT NULL,
    "eSignatureName" TEXT NOT NULL,
    "eSignatureAt" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdIp" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_uid_key" ON "Registration"("uid");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
