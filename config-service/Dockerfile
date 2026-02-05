FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY server.js red5-client.js ./

COPY src ./src

# Create data directory for config file
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "server.js"]
