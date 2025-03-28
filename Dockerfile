FROM node:12.16-alpine

RUN mkdir app
COPY . ./app
WORKDIR ./app/

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]