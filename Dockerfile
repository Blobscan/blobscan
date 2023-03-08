FROM node:18-alpine AS builder
RUN npm install -g pnpm
ENV MONGODB_URI="NOT_SET"
ENV MONGODB_DB="NOT_SET"
WORKDIR /app
COPY . .
RUN pnpm install
RUN npm run build

FROM node:18-alpine AS production
RUN npm install -g pnpm
ENV MONGODB_URI=${MONGODB_URI}
ENV MONGODB_DB=${MONGODB_DB}
WORKDIR /app
COPY --chown=node --from=builder /app/next.config.js ./
COPY --chown=node --from=builder /app/public ./public
COPY --chown=node --from=builder /app/.next ./.next
COPY --chown=node --from=builder /app/pnpm-lock.yaml /app/package.json ./
COPY --chown=node --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["pnpm", "start"]
