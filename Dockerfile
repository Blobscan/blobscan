FROM node:18.15-alpine as builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install
RUN npm run build

FROM node:18.15-alpine AS production
RUN npm install -g pnpm
WORKDIR /app
COPY --chown=node --from=builder /app/apps/nextjs/next.config.mjs ./
COPY --chown=node --from=builder /app/apps/nextjs/package.json ./
COPY --chown=node --from=builder /app/apps/nextjs/public ./public
COPY --chown=node --from=builder /app/apps/nextjs/.next ./.next
COPY --chown=node --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --chown=node --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
EXPOSE 5556
CMD ["pnpm", "start"]
