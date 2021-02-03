## This container generates language files
FROM alpine:3.7 AS langbuilder
RUN apk add --no-cache gettext
COPY lang/ lang/

ARG BOT_NAME=QTweet
ARG PREFIX=!!

RUN for file in ./lang/*.ftl; do f=${file%.ftl}; cat $file | envsubst '$BOT_NAME:$PREFIX' > $f.o.ftl; echo "Built $f.o.ftl "; done

## This container compiles src/ files from typescript to javascript
FROM node:15.7.0-alpine AS compiler
WORKDIR /app

# Copy build files and install using yarn
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Copy everything over
COPY . .

RUN yarn build


## This is the actual qtweet container, using the results from the 2 previous containers
FROM node:15.7.0-alpine
WORKDIR /app

COPY config.json .
COPY package.json .
COPY yarn.lock .
RUN yarn install --production

# Copy generated language files
COPY --from=langbuilder /lang/*.o.ftl lang/
# Copy dist files over
COPY --from=compiler /app/dist ./dist

CMD [ "node", "-r", "esm", "dist/src/index.js" ]
