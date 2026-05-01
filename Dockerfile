,WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/certs ./certs
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 8443
CMD ["node", "src/server.js"]