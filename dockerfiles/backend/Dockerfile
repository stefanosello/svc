FROM node:14 as base
WORKDIR /home/node/app
COPY ./backend/*.json ./
RUN yarn install
COPY ./backend/. .