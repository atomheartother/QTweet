FROM node:11.15.0
WORKDIR /usr/src/app

# Copy build files and install using yarn
COPY package.json ./
COPY yarn.lock ./
RUN yarn

# Copy everything over
COPY . .

EXPOSE 8080

CMD [ "yarn", "start" ]