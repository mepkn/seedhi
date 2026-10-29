# The API image. Node runs the TypeScript in src/ directly (no build step), so
# the image is the production dependencies, the source and the migrations.
#   docker build -t seedhi-react-api backend
# The same image runs the app (default command) and the migrations
# (node src/db/migrate.ts) as a one-off container before the app starts.

# Stage 1: install production dependencies only. Copying the package files
# first lets Docker reuse this layer until they change.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: the runtime image. The npm cache and anything else stage 1 left
# behind stays there; only node_modules is copied over.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle ./drizzle
COPY src ./src
# Run as the unprivileged user the node image ships with, not root.
USER node
EXPOSE 3000
CMD ["node", "src/index.ts"]
