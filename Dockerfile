# ==========================================
# CHALLENGE: Tulis Dockerfile multi-stage untuk Express.js & Vite serta Nginx sebagai proxy dari backend dan jadi webserver pada frontend
# ==========================================

# Step 1: Base Image (Vite Frontend Build)
FROM node:23-alpine as build
WORKDIR /app


# Step 2: Install Dependencies & Build Frontend

COPY /frontend/package.json ./frontend/

RUN cd frontend && npm install

COPY /frontend/ ./frontend/

RUN cd frontend && npm run build


# Step 3: Base Image (Express Backend)
# ...

# Step 4: Install Dependencies for Backend

COPY /backend/package.json ./backend/

RUN cd backend && npm install

COPY /backend/ ./backend/

RUN cd backend && npm run build

RUN docker --debug

# Step 5: Final Runner Image (Nginx + Node)
FROM nginx:1.27-alpine AS production

# Remove default nginx config and content
RUN rm -rf /etc/nginx/conf.d/default.conf \
           /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/app.conf

# Copy minified assets from builder
COPY --from=build /app/dist /usr/share/nginx/html

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /var/cache/nginx \
                              /var/log/nginx \
                              /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

# Step 6: Expose Port & Command
# ...
