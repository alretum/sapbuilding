# Node 24 (current LTS) — satisfies Next 16 (>=20.9) and Prisma.
FROM node:24-alpine

# Prisma needs these on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Apply DB migrations, then start the custom server (Next + Socket.IO)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
