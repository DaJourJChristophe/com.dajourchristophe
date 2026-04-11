FROM node:24-bookworm

WORKDIR /workspace

ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
COPY gulpfile.js ./
COPY scripts ./scripts

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "scripts/dev-container.cjs"]
