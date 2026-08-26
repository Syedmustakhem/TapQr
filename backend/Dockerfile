# ============================================
# Stage 1: Build
# ============================================

FROM node:22-alpine AS builder

WORKDIR /app

# Prisma requires OpenSSL
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package*.json ./

# Copy Prisma configuration and schema/migrations
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install all dependencies
# Includes Prisma CLI for generate/build
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy application source
COPY src ./src

# Generate Prisma Client and build TypeScript
RUN npm run build


# ============================================
# Stage 2: Production Runtime
# ============================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Prisma requires OpenSSL at runtime
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
# Prisma is intentionally included because it is
# required for the separate migration task.
RUN npm ci --omit=dev --ignore-scripts

# Copy generated Prisma Client and query engine
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema, migrations and config
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Copy compiled application
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]