#!/bin/bash

# Build script for BI Forecasting Application

set -e

echo "🚀 Building BI Forecasting Application Docker Image..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
IMAGE_NAME="bi-forecasting-app"
TAG="${IMAGE_NAME}:${VERSION}"
LATEST_TAG="${IMAGE_NAME}:latest"

echo "📦 Building version: ${VERSION}"

# Build the Docker image
docker build -t ${TAG} -t ${LATEST_TAG} .

echo "✅ Build completed successfully!"
echo "📋 Image tags created:"
echo "   - ${TAG}"
echo "   - ${LATEST_TAG}"

# Optional: Show image size
echo "📊 Image size:"
docker images ${IMAGE_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "🎯 Next steps:"
echo "   Run: docker run -p 3000:3000 ${LATEST_TAG}"
echo "   Or:  docker-compose up"