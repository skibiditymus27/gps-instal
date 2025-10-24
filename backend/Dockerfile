# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
RUN npm install --production

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY . .

RUN npm install --only=dev

FROM node:20-alpine AS final
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/src ./src

EXPOSE 3000
CMD ["node", "src/server.js"]
