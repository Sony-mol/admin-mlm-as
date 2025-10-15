# Build stage
FROM node:20-bullseye AS builder

WORKDIR /app

# Copy package file only (not package-lock.json to avoid optional dependency issues)
COPY package.json ./

# Install dependencies - fresh install will properly handle optional dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-bullseye-slim

WORKDIR /app

# Copy built files and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
# BACKEND_URL lets us proxy to the backend without CORS
ENV BACKEND_URL="https://asmlmbackend-production.up.railway.app"
CMD ["node", "server.js"]

