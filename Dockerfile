#FROM node:20-alpine as builder
# Pinned due to https://github.com/nodejs/docker-node/issues/2009
FROM node:20-alpine3.18 as base

ADD docker-entrypoint.sh /

FROM base as deps

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
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
RUN turbo prune @blobscan/prisma --docker --out-dir /prepare/prisma

FROM deps as prisma-builder

WORKDIR /prisma
COPY --from=deps /prepare/prisma/json/packages/prisma/package.json .
COPY --from=deps /prepare/prisma/pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -D --ignore-workspace

COPY --from=deps /prepare/web/full/packages/db/prisma/schema.prisma .
COPY --from=deps /prepare/web/full/packages/db/prisma/migrations ./migrations

FROM deps AS web-builder

WORKDIR /app
COPY --from=deps /prepare/web/json .
COPY --from=deps /prepare/web/pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=deps /prepare/web/full .

# Copy original which includes pipelines
COPY --from=deps /prepare/turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --filter=@blobscan/web

FROM base AS web
RUN apk add bash
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=prisma-builder --chown=nextjs:nodejs /prisma ./prisma

COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["/docker-entrypoint.sh", "web"]
CMD ["--help"]

FROM deps AS api-builder

WORKDIR /app
COPY --from=deps /prepare/api/json .
COPY --from=deps /prepare/api/pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=deps /prepare/api/full .

# Copy original which includes pipelines
COPY --from=deps /prepare/turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --filter=@blobscan/rest-api-server

FROM node:20-bookworm-slim as api
RUN apt-get update -y && apt-get install -y openssl bash
WORKDIR /app

ENV NODE_ENV production

COPY --from=prisma-builder --chown=nextjs:nodejs /prisma ./prisma
COPY --from=api-builder /app/apps/rest-api-server/dist ./


RUN mv /app/client/* /app/

EXPOSE 3001
ENV PORT 3001

ADD docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh", "api"]
CMD ["--help"]
