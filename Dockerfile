# --------------------------------
# Stage 1: Build React frontend
# --------------------------------
FROM node:18 AS frontend-build

WORKDIR /consultation-app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build


# ----------------------------------------------
# Stage 2: Final container with backend + NGINX
# ----------------------------------------------
FROM node:18

# Install required tools
RUN apt-get update && apt-get install -y \
  nginx \
  cron \
  libnss3-tools \
  curl \
  ca-certificates && \
  curl -JLO https://dl.filippo.io/mkcert/latest?for=linux/amd64 && \
  chmod +x mkcert-v*-linux-amd64 && \
  mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert && \
  mkcert -install

# Generate self-signed certs
WORKDIR /certs
RUN mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost

# Set working directory for app
WORKDIR /consultation-app

# ✅ Copy backend code and .env
COPY backend ./backend
COPY backend/.env ./backend/.env

# Install backend dependencies
RUN cd backend && npm install && npm install --save-dev nodemon

# ✅ Copy certs to backend
RUN mkdir -p ./backend/certs && \
    cp /certs/localhost*.pem ./backend/certs/

# Copy frontend source (optional, for debugging or static assets)
COPY frontend/ ./frontend

# ✅ Copy certs to frontend (optional, if frontend reads them)
RUN mkdir -p ./frontend/certs && \
    cp /certs/localhost*.pem ./frontend/certs/

# ✅ Copy built frontend to NGINX serving directory
COPY --from=frontend-build /consultation-app/frontend/build/ /var/www/html

# ✅ Copy custom NGINX config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# ------------------------------------
# Setup cron job for NAS video transfer
# ------------------------------------
COPY script/move-to-nas.sh /script/move-to-nas.sh
COPY script/cronfile /etc/cron.d/move-cron

# Make shell script executable
RUN chmod +x /script/move-to-nas.sh

# Set correct permissions for cron job file
RUN chmod 0644 /etc/cron.d/move-cron

# Ensure cron log directory exists
RUN mkdir -p /script/logs


# ✅ Expose HTTPS frontend and backend ports
EXPOSE 443    
EXPOSE 5000   

# ----------------------------------
# Final CMD: Start cron, backend & nginx
# ----------------------------------
# ✅ Directly run startup logic inside CMD
CMD /bin/sh -c '\
  echo "📌 Starting cron daemon..." && \
  cron && \
  echo "📌 Starting backend..." && \
  node ./backend/server.js & \
  echo "📌 Starting nginx..." && \
  nginx -g "daemon off;" \
'

