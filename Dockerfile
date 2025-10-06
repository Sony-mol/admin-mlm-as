# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci --legacy-peer-deps

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Verify dist folder was created
RUN ls -la dist/

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve
RUN npm install -g serve@14.2.1

# Copy built files from builder
COPY --from=builder /app/dist /app/dist

# Verify files were copied
RUN ls -la /app/dist/

# Expose port (Railway will use $PORT)
EXPOSE 3000

# Start the application  
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]

