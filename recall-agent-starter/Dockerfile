FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy essential files
COPY src/index.js ./src/
COPY characters ./characters/

# Create an empty .env file if needed
RUN touch .env

# Final image
FROM node:22-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/characters ./characters
COPY --from=builder /app/.env ./

# Create data directory
RUN mkdir -p data

# Set environment variables for better performance
ENV NODE_OPTIONS="--no-warnings"
ENV TOKENIZERS_PARALLELISM=false
ENV SERVER_PORT=3000

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/index.js"] 