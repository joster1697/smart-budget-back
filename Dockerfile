# ── Stage: base ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Stage: development ────────────────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Stage: builder ────────────────────────────────────────────────────────────
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# ── Stage: production ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY sequelize.config.js ./
EXPOSE 3000
CMD ["sh", "-c", "npx sequelize-cli db:migrate && npm run start"]
