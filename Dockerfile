#FROM node:20-alpine AS builder
# Pinned due to https://github.com/nodejs/docker-node/issues/2009
FROM node:20-alpine3.18 AS base

ADD docker-entrypoint.sh /

# stage: deps
FROM base AS deps

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
ARG NEXT_PUBLIC_BLOBSCAN_RELEASE
ENV NEXT_PUBLIC_BLOBSCAN_RELEASE=$NEXT_PUBLIC_BLOBSCAN_RELEASE
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Do not perform environment variable validation during build time
ENV SKIP_ENV_VALIDATION=true

RUN apk add bash curl
RUN npm install -g pnpm turbo
WORKDIR /app
RUN mkdir -p /tmp/blobscan-blobs && chmod 777 /tmp/blobscan-blobs

COPY . /prepare
WORKDIR /prepare

RUN turbo prune @blobscan/web --docker --out-dir /prepare/web
RUN turbo prune @blobscan/rest-api-server --docker --out-dir /prepare/api

# stage: web-builder
FROM deps AS web-builder

WORKDIR /app

ARG DATABASE_URL
ARG DIRECT_URL

ENV NEXT_BUILD_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /prepare/web/json .
COPY --from=deps /prepare/web/pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=deps /prepare/web/full .

# Copy original which includes pipelines
COPY --from=deps /prepare/turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store DATABASE_URL=${DATABASE_URL} DIRECT_URL=${DIRECT_URL} pnpm build --filter=@blobscan/web

# stage: web
FROM base AS web
RUN apk add bash
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=web-builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=web-builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=web-builder --chown=nextjs:nodejs /prepare/api/full/packages/db/prisma/migrations ./migrations
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["web"]

# stage: api-builder
FROM deps AS api-builder

WORKDIR /app

ARG DATABASE_URL
ARG DIRECT_URL


COPY --from=deps /prepare/api/json .
COPY --from=deps /prepare/api/pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=deps /prepare/api/full .

# Copy original which includes pipelines
COPY --from=deps /prepare/turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store DATABASE_URL=${DATABASE_URL} DIRECT_URL=${DIRECT_URL} pnpm build --filter=@blobscan/rest-api-server

# stage: api
FROM base AS api
RUN apk add bash
WORKDIR /app

ENV NODE_ENV=production

COPY --from=api-builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=api-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=api-builder /app/apps/rest-api-server/dist ./
COPY --from=api-builder /prepare/api/full/packages/db/prisma/migrations ./migrations

EXPOSE 3001
ENV PORT=3001

ADD docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["api"]
