# === base
FROM node:24-slim AS base

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y \
    libuuid1 \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# === deps
FROM base AS deps

COPY package* . 

RUN npm install

# === builder
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# === runner
# ベースイメージを`node:20-slim`に変更（必要ライブラリが含まれているため）
FROM node:24-slim AS runner

# フォントをインストール
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

USER node

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
