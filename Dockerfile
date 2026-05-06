FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/
RUN npx tsup src/index.ts --format esm
RUN npm prune --production

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js", "serve", "--port", "3000", "--host", "0.0.0.0"]
