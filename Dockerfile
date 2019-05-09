FROM node:10-slim

RUN apt-get update && \
    apt-get install --no-install-recommends -y

LABEL "com.github.actions.name"="aws-instance-ripper"
LABEL "com.github.actions.description"="Clean AWS instance automatically"
LABEL "com.github.actions.icon"="cloud-lightning"
LABEL "com.github.actions.color"="red"

LABEL version="1.0.0"
LABEL repository="https://github.com/helaili/aws-instance-ripper"
LABEL homepage="https://github.com/helaili/aws-instance-ripper"
LABEL maintainer="Alain Hélaïli <helaili@github.com>"

ADD package.json /package.json
ADD package-lock.json /package-lock.json
WORKDIR /

RUN npm ci

COPY . /

ENTRYPOINT ["node", "/entrypoint.js"]
