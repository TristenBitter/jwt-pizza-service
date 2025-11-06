ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all application files
COPY . .

# Expose port
EXPOSE 80

# Set PORT environment variable
ENV PORT=80

# Start the application
CMD ["node", "index.js"]