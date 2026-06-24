# Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install OpenSSL (Required for Prisma client on Alpine)
RUN apk add --no-cache openssl

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose the API port
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]