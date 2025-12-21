# Use the official Ubuntu 24.04 LTS as a base image
FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Update and install essential tools
RUN apt-get update && apt-get install -y curl wget gnupg ca-certificates python3 python3-pip python3-venv

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Create virtual environment and install dependencies
RUN python3 -m venv .venv && \
    . .venv/bin/activate && \
    pip install --upgrade pip && \
    pip install flask flask-cors pymongo pyjwt flask-talisman flask-limiter gunicorn

# Environment variables
ENV APP_ENV=prod
ENV STUDY_PLAN_SERVICE_PORT=5500

# Expose API port
EXPOSE 5500

# Start Gunicorn
CMD ["sh", "-c", ". .venv/bin/activate && gunicorn -w 2 -b 0.0.0.0:5500 server:app"]
