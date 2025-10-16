FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for ts-node)
RUN npm install

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port (matches your local dev server)
EXPOSE 3000

# Run the same command that works locally
CMD ["npx", "ts-node", "src/server.ts"]
