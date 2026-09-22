# Stage 1: Build the React client with Vite
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy server package and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund

# Copy server code
COPY server/ ./server/
COPY package*.json ./

# Copy compiled client build from stage 1 into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/server.js"]
