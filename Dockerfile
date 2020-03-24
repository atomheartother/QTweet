FROM alpine:3.7 AS langbuilder
RUN apk add --no-cache gettext
COPY lang/ lang/

ARG BOT_NAME
ARG PREFIX

RUN for file in ./lang/*.ftl; do f=${file%.ftl}; cat $file | envsubst '$BOT_NAME:$PREFIX' > $f.o.ftl; echo "Built $f.o.ftl "; done

FROM node:14.3.0-slim
WORKDIR /usr/src/app

# Copy build files and install using yarn
COPY package.json .
COPY yarn.lock .
RUN yarn install --production

# Copy everything over
COPY . .
# Copy generated language files
COPY --from=langbuilder /lang/*.o.ftl lang/

RUN yarn build

CMD [ "node", "-r", "esm", "dist/index.js"]
