FROM node:20-alpine

WORKDIR /app

# Copy package manifest
COPY package.json ./

# Install dependencies using standard npm (avoids pnpm ERR_PNPM_IGNORED_BUILDS issue)
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
