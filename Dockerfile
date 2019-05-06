FROM node:10-slim

RUN apt-get update && \
    apt-get install --no-install-recommends -y

LABEL "com.github.actions.name"="instance-tag-analyzer"
LABEL "com.github.actions.description"="Analyze AWS instance tags"
LABEL "com.github.actions.icon"="cloud-lightning"
LABEL "com.github.actions.color"="red"

LABEL version="1.0.0"
LABEL repository="https://github.com/helaili/aws-instance-tag-analyzer"
LABEL homepage="https://github.com/helaili/aws-instance-tag-analyzer"
LABEL maintainer="Alain Hélaïli <helaili@github.com>"

ADD package.json /package.json
WORKDIR /

RUN npm ci

COPY . /

ENTRYPOINT ["node", "/entrypoint.js"]
