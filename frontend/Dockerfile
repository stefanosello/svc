FROM node:14 as base
WORKDIR /home/vue/app
COPY ./*.json ./
RUN yarn install
COPY . .