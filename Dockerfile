#FROM node:20-alpine as builder
# Pinned due to https://github.com/nodejs/docker-node/issues/2009
FROM node:20-alpine3.18 as base

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

COPY --from=web-builder --chown=nextjs:nodejs /prepare/web/full/packages/db ./packages/db
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT 3000

ADD docker-entrypoint.sh /

# CMD node /app/apps/web/server.js
ENTRYPOINT ["/docker-entrypoint.sh", "web"]
CMD ["--help"]
