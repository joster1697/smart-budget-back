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

# Create .sequelizerc to point to the compiled config module and migrations
RUN echo "const path = require('path'); module.exports = { 'config': path.resolve('dist/database/config/config.js'), 'migrations-path': path.resolve('dist/database/migrations'), 'seeders-path': path.resolve('dist/database/seeders'), 'models-path': path.resolve('dist/database/models') };" > .sequelizerc

EXPOSE 3000
CMD ["sh", "-c", "npx sequelize-cli db:migrate --config dist/database/config/config.js --migrations-path dist/database/migrations && npx sequelize-cli db:seed:all --config dist/database/config/config.js --seeders-path dist/database/seeders && npm run start"]
