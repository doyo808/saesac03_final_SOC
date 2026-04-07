FROM alpine:3.20
RUN mkdir -p /pack/db /pack/was /pack/dmz /pack/admin-office
COPY docker-compose.yml /pack/db/docker-compose.yml
COPY deploy/was/docker-compose.yml /pack/was/docker-compose.yml
COPY deploy/dmz/docker-compose.yml /pack/dmz/docker-compose.yml
COPY deploy/admin-office/docker-compose.yml /pack/admin-office/docker-compose.yml
