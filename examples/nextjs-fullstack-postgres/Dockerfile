# The Next.js image: the standalone server from `next build`, plus what the
# migrate script needs. The same image runs the app (default command) and the
# migrations (node src/db/migrate.ts) as a one-off container.
#   docker build -t seedhi-nextjs .

# Stage 1: all dependencies, dev ones included: `next build` needs them.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build. output: "standalone" (next.config.ts) writes
# .next/standalone with server.js and only the node_modules files it uses.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: the migrate script's dependencies. The standalone server bundles
# drizzle-orm and zod into its own files, but the migrate script runs with
# plain node and imports them from node_modules. Install the runtime
# dependencies minus Next.js and React (the lockfile keeps the versions).
FROM node:22-alpine AS migrate-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete dependencies.next dependencies.react dependencies.react-dom \
 && npm install --omit=dev --no-audit --no-fund

# Stage 4: the runtime image. Nothing from stages 1 and 2 except the build
# output: no dev dependencies, no source of the app itself.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=migrate-deps /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY drizzle ./drizzle
COPY src/db/migrate.ts ./src/db/
COPY src/lib/env.ts src/lib/logger.ts ./src/lib/
# Run as the unprivileged user the node image ships with, not root.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
