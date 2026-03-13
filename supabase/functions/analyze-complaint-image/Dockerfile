FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Install ts-node globally
RUN npm install -g ts-node typescript

# Expose port
EXPOSE 3000

# Set environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000

# Run the application
CMD ["ts-node", "index.ts"]
