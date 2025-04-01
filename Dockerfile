FROM node:18-alpine3.18
WORKDIR /app
COPY package*.json ./
COPY server.yopta ./
COPY data.json ./
RUN npm install && npm install -g run-yopta
EXPOSE 3000
CMD ["run-yopta", "server.yopta"]