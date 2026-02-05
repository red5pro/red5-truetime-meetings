# Multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install --silent

# Install env-cmd for environment variable handling
RUN npm install -g env-cmd

# Copy source code
COPY . .

# Generate build info and build the app using .env.docker
RUN npm run build:docker

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy startup script and make it executable
COPY ci/docker_startup_script.sh /docker_startup_script.sh
RUN chmod +x /docker_startup_script.sh

# Expose port 80
EXPOSE 80

# Start startup script
CMD ["/bin/sh", "-c", "/docker_startup_script.sh"]