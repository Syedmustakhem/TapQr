# ============================================
# Stage 1: Build
# ============================================

FROM node:22-alpine AS builder

WORKDIR /app

# Prisma requires OpenSSL
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package*.json ./

# Copy Prisma BEFORE npm ci
# because package.json has a postinstall:
# "prisma generate"
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install ALL dependencies (dev + prod)
# needed here to compile TypeScript and run "prisma generate"
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy application source
COPY src ./src

# Build application
RUN npm run build


# ============================================
# Stage 2: Production Runtime
# ============================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Prisma requires OpenSSL at runtime too
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only.
# --ignore-scripts skips postinstall ("prisma generate"),
# since the "prisma" CLI is intentionally NOT installed here.
# We still end up with @prisma/client's "prisma" as an optional
# peer dependency pulled in by npm, so we force-remove dev-only
# / CLI-only packages that have no business being in production.
RUN npm ci --omit=dev --ignore-scripts \
    && rm -rf node_modules/prisma \
    && rm -rf node_modules/typescript \
    && rm -rf node_modules/effect \
    && rm -rf node_modules/fast-check \
    && rm -rf node_modules/.bin/prisma \
    && rm -rf node_modules/.bin/tsc

# Copy the already-generated Prisma client + query engine
# from the builder stage instead of regenerating here
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]