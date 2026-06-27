# NestJS Backend Dockerfile for Development and Production

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy all packages and apps
COPY packages ./packages
COPY apps/service ./apps/service

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build backend
WORKDIR /app/apps/service
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/service/package.json ./apps/service/

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/apps/service/dist /app/apps/service/dist
COPY --from=builder /app/apps/service/prisma /app/apps/service/prisma

WORKDIR /app/apps/service

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/main.js"]
