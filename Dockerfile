FROM node:18-alpine3.16 AS base
WORKDIR /app
COPY package.json package-lock.json ./
ENV TZ="Asia/Jakarta"
ENV LC_ALL=C

FROM base AS dependencies
RUN npm ci

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM base AS run
COPY --from=build /app/build ./build
COPY --from=dependencies /app/node_modules ./node_modules 
COPY config.json ./config.json
COPY data ./data
ENTRYPOINT [ "npm", "start" ]