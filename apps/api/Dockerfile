FROM oven/bun:1.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile || bun install

COPY . .

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "cd /app && bun run db:migrate && cd /app/apps/api && bun run start"]
