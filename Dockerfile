FROM node:8-alpine

WORKDIR /appops

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

RUN npm config set registry https://registry.npm.taobao.org

RUN npm install nej -g

COPY . /appops

RUN npm install

RUN npm run build

RUN node -e "c=require('./server/config/online.js');c.ip.disabled=true;c.mysql.host='mysql';c.redis.host='redis';c.mongodb.url=c.mongodb.url.replace('127.0.0.1', 'mongodb');console.log('module.exports =' + JSON.stringify(c))" > config.js
RUN cp config.js ./server/config/online.js

CMD [ "node", "bin/server.js", "start", "-m", "online" ]