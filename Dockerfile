#FROM node:18-alpine as builder
FROM node:18.15-alpine

RUN apk add bash curl

ENV SECRET_KEY supersecret
ENV BEE_DEBUG_ENDPOINT http://localhost:1635
ENV BEE_ENDPOINT http://localhost:1633
ENV CHAIN_ID 7011893055
ENV GOOGLE_STORAGE_BUCKET_NAME blobscan-staging

RUN npm install -g pnpm
WORKDIR /app

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store/v3 pnpm fetch -r

ADD . ./
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store/v3 pnpm install -r

RUN npm run build
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
