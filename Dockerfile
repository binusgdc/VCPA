# We're using Alpine Edge
FROM alpine:edge

# Using UTC+7 time
ENV TZ="Asia/Jakarta"
ENV LC_ALL id_ID.UTF-8
ENV NODE_ENV production
WORKDIR /VCPA/

RUN apk add --no-cache --update \
    nodejs-current \
    npm

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
