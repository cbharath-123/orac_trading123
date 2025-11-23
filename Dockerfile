FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
