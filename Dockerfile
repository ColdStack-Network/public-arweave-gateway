FROM node:14
EXPOSE 3000 9229

WORKDIR /home/app
COPY ./src /home/app/src
COPY package-lock.json /home/app/package-lock.json
COPY package.json /home/app/package.json


RUN npm i



CMD npm run start
