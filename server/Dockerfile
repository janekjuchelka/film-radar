FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src
COPY public ./public
RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3847
ENV API_HOST=0.0.0.0
ENV SCAN_CRON=0 8 * * *
ENV MIN_CSFD_RATING=70
ENV SCAN_ON_START=true
ENV SCAN_PER_PROVIDER=30

EXPOSE 3847

CMD ["npx", "tsx", "src/index.ts"]
