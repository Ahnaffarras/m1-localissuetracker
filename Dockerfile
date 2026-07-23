# ==========================================
# CHALLENGE: Tulis Dockerfile multi-stage untuk Express.js & Vite serta Nginx sebagai proxy dari backend dan jadi webserver pada frontend
# ==========================================

# Step 1: Base Image (Vite Frontend Build)
FROM node:23-alpine as frontend-build
WORKDIR /app/frontend


# Step 2: Install Dependencies & Build Frontend

COPY /frontend/package.json ./

RUN npm ci

COPY /frontend/ ./

RUN npm run build


# Step 3: Base Image (Express Backend)

FROM node:23-alpine as backend-build

WORKDIR /app/backend

COPY /backend/package*.json ./

# Step 4: Install Dependencies for Backend
RUN npm ci

COPY /backend/ ./


# Step 5: Final Runner Image (Nginx + Node)
FROM nginx:1.25-alpine as production

# Copy
COPY --from=frontend-build /usr/local/bin/node /usr/local/bin/node

COPY --from=frontend-build /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm


COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

WORKDIR /app/backend

COPY --from=backend-build /app/backend ./

COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

COPY  docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh


# Step 6: Expose Port & Command
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]