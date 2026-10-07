FROM node:22-bookworm-slim

WORKDIR /app

# Tools that node:*-alpine shipped via busybox; health probes may rely on them
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget curl netcat-openbsd ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --production

COPY server.js red5-client.js ./

COPY src ./src

# Create data directory for config file
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "server.js"]
