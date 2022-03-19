FROM node:14 as base
WORKDIR /home/node/app
COPY ./*.json ./
RUN yarn install
COPY . .
EXPOSE $BACKEND_HTTP_PORT