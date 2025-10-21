# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]

