# Counter Check on Google Cloud Run: a plain Node server built from the same source.
# Secrets are NOT in the image: Cloud Run injects YOUCAM_API_KEY and GEMINI_API_KEY from Secret Manager.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", ".output/server/index.mjs"]
