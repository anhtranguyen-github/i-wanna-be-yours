# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install uv, then use it to install dependencies from requirements.txt
RUN pip install uv && uv pip install --system --no-cache -r requirements.txt

# Copy the content of the local src directory to the working directory
COPY . .

# Make port 5400 available to the world outside this container
EXPOSE 5400

# Define environment variable
ENV FLASK_APP=app.py

# Run app.py when the container launches
CMD ["flask", "run", "--host=0.0.0.0", "--port=5400"]
# source .venv/bin/activate && uv pip install -r requirements.txt
# FLASK_APP=app.py flask run --host=0.0.0.0 --port=5400
# mongod --dbpath /data/db --bind_ip_all --fork --logpath /var/log/mongodb/mongod.log 
# docker start 2f7e55b055f