-- CreateEnum
CREATE TYPE "ConversationHandlingMode" AS ENUM ('AI', 'HUMAN');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "handlingMode" "ConversationHandlingMode" NOT NULL DEFAULT 'AI';

-- CreateIndex
CREATE INDEX "Conversation_handlingMode_idx" ON "Conversation"("handlingMode");
