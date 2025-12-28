# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory in the container
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies using uv
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the rest of the application
COPY . .

# Make port 5000 and 5400 available
EXPOSE 5000
EXPOSE 5400

# Define environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1
ENV FLASK_RUN_PORT=5400

# Run app.py when the container launches
# Using --port=5400 to match docker-compose and host expectations
CMD ["flask", "run", "--host=0.0.0.0", "--port=5400"]
