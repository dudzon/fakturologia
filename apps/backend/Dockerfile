# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules like bcrypt
RUN apk add --no-cache python3 make g++

# Copy workspace-level configs if any (e.g. package.json if it was a monorepo)
# But here it's simple apps/backend
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Only copy what's needed for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Standard Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Environment variables will be provided by Cloud Run
CMD ["node", "dist/main"]
