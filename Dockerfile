FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) for the build process
RUN npm ci && npm cache clean --force

COPY . .

# Build without migrations (DATABASE_URL not available during build)
# Migrations will run at startup via docker-start script
RUN DATABASE_URL="postgresql://placeholder" SHOPIFY_APP_URL="https://stories-app.fly.dev" npm run build:docker

# Now remove dev dependencies and CLI packages to reduce image size
RUN npm prune --omit=dev
RUN npm remove @shopify/cli || true

CMD ["npm", "run", "docker-start"]
