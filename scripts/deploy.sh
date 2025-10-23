#!/bin/bash

# Deployment script for BI Forecasting Application

set -e

echo "🚀 Deploying BI Forecasting Application..."

# Configuration
IMAGE_NAME="bi-forecasting-app"
CONTAINER_NAME="bi-forecasting-container"
PORT="3000"

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q ${CONTAINER_NAME}; then
    echo "🛑 Stopping existing container..."
    docker stop ${CONTAINER_NAME} || true
    docker rm ${CONTAINER_NAME} || true
fi

# Pull latest image (if using registry)
# docker pull ${IMAGE_NAME}:latest

# Run the new container
echo "🏃 Starting new container..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3000 \
    --restart unless-stopped \
    --health-cmd="curl -f http://localhost:3000/api/health || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    ${IMAGE_NAME}:latest

echo "⏳ Waiting for application to start..."
sleep 10

# Check if container is running
if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q ${CONTAINER_NAME}; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at: http://localhost:${PORT}"
    echo "🏥 Health check: http://localhost:${PORT}/api/health"
    
    # Show container status
    echo ""
    echo "📊 Container status:"
    docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Deployment failed!"
    echo "📋 Container logs:"
    docker logs ${CONTAINER_NAME}
    exit 1
fi