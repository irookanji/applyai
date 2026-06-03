FROM oven/bun:1.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile || bun install

COPY . .

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
