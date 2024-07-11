# BUILDER
FROM node:20.8-slim AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Build
RUN npm run build

# RUNNER
FROM node:20.8-slim
WORKDIR /app

# Copy the build output and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production

# Set environment variables
ENV PORT 3000

# Expose the port
EXPOSE $PORT

CMD ["npm", "run", "start"]
