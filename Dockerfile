FROM alpine:3.7 AS langbuilder
RUN apk add --no-cache gettext
WORKDIR /usr/src/app
COPY . .

ARG BOT_NAME
ARG PREFIX

RUN for file in ./lang/*.ftl; do f=${file%.ftl}; cat $file | envsubst '$BOT_NAME:$PREFIX' > $f.o.ftl; echo "Built $f.o.ftl "; done

FROM node:13.6.0-slim
WORKDIR /usr/src/app

# Copy build files and install using yarn
COPY --from=langbuilder /usr/src/app/package.json ./
COPY --from=langbuilder /usr/src/app/yarn.lock ./
RUN yarn install --production

# Copy everything over
COPY --from=langbuilder /usr/src/app/ .

CMD [ "node", "-r", "esm", "src/index.js"]
