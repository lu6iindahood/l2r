FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code and build
COPY . .
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
