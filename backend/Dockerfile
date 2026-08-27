# ============================================
# Stage 1: Build
# ============================================

FROM node:22-alpine AS builder

WORKDIR /app

# Prisma requires OpenSSL
RUN apk add --no-cache openssl

# Copy package files first for better Docker caching
COPY package*.json ./

# Install dependencies
# IMPORTANT:
# package.json should NOT contain:
# "postinstall": "prisma generate"
RUN npm ci

# Copy Prisma configuration and schema
COPY prisma.config.ts ./
COPY prisma ./prisma

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy application source
COPY src ./src

# Generate Prisma Client and compile TypeScript.
# Prisma generate does not need to connect to Neon,
# but prisma.config.ts requires DIRECT_URL.
# A dummy build-time URL is therefore supplied.
RUN DIRECT_URL="postgresql://build:build@localhost:5432/build" npm run build


# ============================================
# Stage 2: Production
# ============================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Prisma requires OpenSSL at runtime
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies only.
# --ignore-scripts prevents Prisma from being
# automatically generated during this stage.
RUN npm ci --omit=dev --ignore-scripts

# Copy generated Prisma Client
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Application port
EXPOSE 5000

# Start TapQR backend
CMD ["node", "dist/server.js"]