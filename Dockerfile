FROM node:12-alpine as builder

WORKDIR /tmp/nexus-web
COPY . /tmp/nexus-web
# use of --max-old-space to prevent `JavaScript heap out of memory` on docker-hub
RUN npm ci && node --max-old-space-size=4096 `which npm` run build

FROM node:10-alpine
WORKDIR /opt/nexus
COPY --from=builder /tmp/nexus-web/dist /opt/nexus
EXPOSE 8000
ENTRYPOINT ["node", "server.js"]
