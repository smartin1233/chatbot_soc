#!/bin/bash

# Development script for BI Forecasting Application

set -e

echo "🚀 Starting BI Forecasting Application in Development Mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start development environment
echo "🏗️  Building development environment..."
docker-compose -f docker-compose.dev.yml build

echo "🏃 Starting development server..."
docker-compose -f docker-compose.dev.yml up

echo "✅ Development environment started!"
echo "🌐 Application is running at: http://localhost:3000"
echo "🔄 Hot reload is enabled - changes will be reflected automatically"