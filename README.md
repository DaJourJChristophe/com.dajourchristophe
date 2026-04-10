build in Docker Compose with source code mounted as a volume
docker run -v "$PWD:/workspace" my-dev-image


FROM golang:1.24 AS build
WORKDIR /src
COPY . .
RUN go build -o app .

FROM debian:bookworm-slim
COPY --from=build /src/app /usr/local/bin/app
CMD ["app"]







FROM node:22
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
