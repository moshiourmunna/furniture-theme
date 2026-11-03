# Shekor storefront + REST API (Next.js 16).  Build from the repo root:
#   docker build -f docker/web.Dockerfile -t shekor-web .
FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @shekor/db exec prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @shekor/web exec next build

FROM base AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app /app
WORKDIR /app/apps/web
EXPOSE 3000
# Apply migrations on start; set SEED=1 once to load the demo catalogue.
CMD ["sh", "-c", "cd /app/packages/db && pnpm exec prisma migrate deploy && if [ \"$SEED\" = \"1\" ]; then pnpm exec tsx prisma/seed.ts; fi && cd /app/apps/web && pnpm exec next start -p ${PORT}"]
