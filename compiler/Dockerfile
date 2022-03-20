FROM node:12.22 as base
WORKDIR /home/node/app
COPY ./*.json ./
RUN yarn install
COPY . .