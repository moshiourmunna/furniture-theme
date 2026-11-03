# Shekor admin SPA (Vite build served by nginx, /api proxied to the web container).
FROM node:24-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_STORE_URL=http://localhost:3000
ENV VITE_STORE_URL=$VITE_STORE_URL
RUN pnpm --filter @shekor/admin build

FROM nginx:1.27-alpine
COPY docker/admin.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
