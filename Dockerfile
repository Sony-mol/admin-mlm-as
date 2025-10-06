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

# Copy built files
COPY --from=builder /app/dist ./dist

# Install serve globally
RUN npm install -g serve

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "serve -s dist -p ${PORT:-3000}"]

