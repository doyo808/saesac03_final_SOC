FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_ADMIN_PAGE_ENABLED=true
ENV VITE_ADMIN_PAGE_ENABLED=${VITE_ADMIN_PAGE_ENABLED}
ARG VITE_SECURITY_EGRESS_ALLOWED_EMAILS=admin1@campus.local,student1@campus.local
ENV VITE_SECURITY_EGRESS_ALLOWED_EMAILS=${VITE_SECURITY_EGRESS_ALLOWED_EMAILS}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/09-was-upstream.envsh /docker-entrypoint.d/09-was-upstream.envsh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
