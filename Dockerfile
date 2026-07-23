# ==========================================
# CHALLENGE: Tulis Dockerfile multi-stage untuk Express.js & Vite serta Nginx sebagai proxy dari backend dan jadi webserver pada frontend
# ==========================================

# Step 1: Base Image (Vite Frontend Build)
FROM node:23-alpine as frontend-build
WORKDIR /app/frontend


# Step 2: Install Dependencies & Build Frontend

COPY /frontend/package.json ./

RUN npm install

COPY /frontend/ ./

RUN npm run build


# Step 3: Base Image (Express Backend)

FROM node:23-alpine as backend-build

WORKDIR /app/backend

COPY /backend/package*.json ./

# Step 4: Install Dependencies for Backend
RUN npm install

COPY /backend/ ./


# Step 5: Final Runner Image (Nginx + Node)
FROM nginx:1.25-alpine as production

# Copy


RUN apk add --no-cache nodejs npm

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

WORKDIR /app/backend

COPY --from=backend-build /app/backend ./

COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

COPY  docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh


# Step 6: Expose Port & Command
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]