#FROM node:20-alpine as builder
FROM node:20-alpine

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

RUN apk add bash curl
RUN npm install -g pnpm
WORKDIR /app

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store/v3 pnpm fetch -r

ADD . ./
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store/v3 pnpm install -r

# Do not perform environment variable validation during build time
RUN SKIP_ENV_VALIDATION=true npm run build

RUN chown node:node . -R

ADD docker-entrypoint.sh /
USER node

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--help"]

# FROM node:18-alpine AS production
# RUN npm install -g pnpm
# WORKDIR /app
# COPY --chown=node --from=builder /app/apps/web/next.config.mjs ./
# COPY --chown=node --from=builder /app/apps/web/package.json ./
# COPY --chown=node --from=builder /app/apps/web/postcss.config.cjs ./
# COPY --chown=node --from=builder /app/apps/web/tailwind.config.ts.json ./
# COPY --chown=node --from=builder /app/apps/web/tsconfig.json ./
# COPY --chown=node --from=builder /app/apps/web/public ./public
# COPY --chown=node --from=builder /app/apps/web/.next ./.next
# COPY --chown=node --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
# COPY --chown=node --from=builder /app/node_modules ./node_modules
# USER node
#
# CMD ["pnpm", "start"]
