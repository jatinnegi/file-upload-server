FROM node:19.5.0-alpine

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn run build

EXPOSE 1337

CMD ["node", "dist/index.js"]