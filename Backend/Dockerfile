FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/ >/dev/null || exit 1
CMD ["node", "src/server.js"]
