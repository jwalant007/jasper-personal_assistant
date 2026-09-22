# Stage 1: Build the React client with Vite
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy root and server dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --omit=dev && npm install --prefix server --omit=dev

# Copy server code
COPY server/ ./server/

# Copy compiled client build from stage 1
COPY --from=client-builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 3001

# Start JASPER
CMD ["node", "server/server.js"]
