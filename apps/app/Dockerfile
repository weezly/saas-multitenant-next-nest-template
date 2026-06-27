# Next.js Frontend Dockerfile for Development and Production

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy all packages and apps
COPY packages ./packages
COPY apps/app ./apps/app

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build frontend
WORKDIR /app/apps/app
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/app/package.json ./apps/app/

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built application and public files from builder
COPY --from=builder /app/apps/app/.next /app/apps/app/.next
COPY --from=builder /app/apps/app/public /app/apps/app/public
COPY --from=builder /app/apps/app/node_modules /app/apps/app/node_modules

WORKDIR /app/apps/app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "run", "start"]
