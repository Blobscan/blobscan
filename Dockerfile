#FROM node:20-alpine as builder
# Pinned due to https://github.com/nodejs/docker-node/issues/2009
FROM node:20-alpine3.18 as base

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

ADD docker-entrypoint.sh /

FROM base AS api-builder
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --filter=./apps/rest-api-server

FROM base AS web-builder
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch -r
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --filter=./apps/web

FROM base as web
COPY --from=web-builder /app/node_modules /app/node_modules
COPY --from=web-builder /app/packages/db/prisma/schema.prisma /app/packages/db/prisma/schema.prisma
COPY --from=web-builder /app/apps/web /app/apps/web
ENTRYPOINT ["/docker-entrypoint.sh", "web"]
CMD ["--help"]

FROM base as api
# TODO: Probar sin node_modules
COPY --from=api-builder /app/node_modules /app/node_modules
COPY --from=api-builder /app/packages/db/prisma/schema.prisma /app/packages/db/prisma/schema.prisma
COPY --from=api-builder /app/apps/rest-api-server /app/apps/rest-api-server
ENTRYPOINT ["/docker-entrypoint.sh", "api"]
CMD ["--help"]
