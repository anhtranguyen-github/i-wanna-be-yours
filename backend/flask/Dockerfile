# Use the official Ubuntu 24.04 LTS as a base image
FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Update and install essential tools
RUN apt-get update && apt-get install -y curl wget gnupg ca-certificates

# --- MongoDB (v8) installation ---
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor && \
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-8.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    mkdir -p /data/db /var/log/mongodb && \
    chown -R mongodb:mongodb /data/db /var/log/mongodb

# --- Python & uv setup ---
# Install uv (fast Python package and venv manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.cargo/bin:/root/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# --- Flask app setup using uv ---
# Create virtual environment and install dependencies
RUN uv venv && \
    . .venv/bin/activate && \
    uv pip install --upgrade pip && \
    uv pip install flask flask-cors flask-pymongo requests pymongo gunicorn

# Environment variables
ENV FLASK_RUN_HOST=0.0.0.0
ENV APP_ENV=prod

# Expose API port
EXPOSE 5100

# Start MongoDB and Gunicorn using uv environment
CMD ["sh", "-c", "mongod --dbpath /data/db --bind_ip_all --fork --logpath /var/log/mongodb/mongod.log && ./.venv/bin/gunicorn -w 4 -b 0.0.0.0:5100 server:app"]
