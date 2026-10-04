-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "appointmentAdvanceDays" INTEGER,
ADD COLUMN     "appointmentBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appointmentBookingMode" TEXT NOT NULL DEFAULT 'APPOINTMENT',
ADD COLUMN     "appointmentEvents" JSONB,
ADD COLUMN     "appointmentMaxPartySize" INTEGER,
ADD COLUMN     "appointmentMaxTokensPerDay" INTEGER,
ADD COLUMN     "appointmentServices" JSONB,
ADD COLUMN     "appointmentSlotMinutes" INTEGER,
ADD COLUMN     "whatsappOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "specialsValidUntil" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'APPOINTMENT',
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "partySize" INTEGER,
    "tokenNumber" INTEGER,
    "items" JSONB,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "note" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_businessId_idx" ON "Appointment"("businessId");

-- CreateIndex
CREATE INDEX "Appointment_businessId_date_idx" ON "Appointment"("businessId", "date");

-- CreateIndex
CREATE INDEX "Appointment_businessId_status_idx" ON "Appointment"("businessId", "status");

-- CreateIndex
CREATE INDEX "Appointment_businessId_mode_idx" ON "Appointment"("businessId", "mode");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
