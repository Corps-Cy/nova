# Build stage - Backend
FROM node:22-alpine AS backend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsup src/index.ts --format esm

# Build stage - Frontend
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./
COPY --from=backend /app/dist ../dist
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/web/dist ./web/dist
COPY --from=frontend /app/web/public ./web/public

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js", "serve", "--port", "3000", "--host", "0.0.0.0"]
