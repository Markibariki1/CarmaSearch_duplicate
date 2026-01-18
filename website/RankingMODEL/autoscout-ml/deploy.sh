#!/bin/bash
# CARMA API Deployment Script
# Deploys the new clean API to Azure Container Apps

set -e  # Exit on error

echo "🚀 CARMA API Deployment Script"
echo "=============================="
echo ""

# Configuration
VERSION="v1-clean-architecture" # New version for clean rebuild
IMAGE_NAME="carma-api"
REGISTRY="carmaregistry.azurecr.io"
CONTAINER_APP="carma-ml-api"
RESOURCE_GROUP="carma"
API_URL="https://carma-ml-api.greenwater-7817a41f.northeurope.azurecontainerapps.io"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📦 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# --- Main Deployment Steps ---

print_step "0" "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop."
fi
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it."
fi
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure CLI. Please run 'az login'."
fi
print_success "Prerequisites check passed"

print_step "1" "Building Docker image (linux/amd64)..."
cd "$(dirname "$0")"
docker build --platform linux/amd64 \
  -f Dockerfile.flask \
  -t ${IMAGE_NAME}:latest \
  .
print_success "Docker image built successfully"

print_step "2" "Tagging image for Azure Container Registry..."
docker tag ${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:${VERSION}
docker tag ${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:latest
print_success "Image tagged: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"

print_step "3" "Logging in to Azure Container Registry..."
az acr login --name $(echo ${REGISTRY} | cut -d'.' -f1)
print_success "Logged in to ${REGISTRY}"

print_step "4" "Pushing image to registry (this may take a few minutes)..."
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}:latest
print_success "Image pushed to registry"

print_step "5" "Updating Azure Container App..."
az containerapp update \
  --name ${CONTAINER_APP} \
  --resource-group ${RESOURCE_GROUP} \
  --image ${REGISTRY}/${IMAGE_NAME}:${VERSION}
print_success "Container App updated"

print_step "6" "Waiting for deployment to complete (35 seconds)..."
sleep 35 # Give Azure time to provision the new revision

print_step "7" "Verifying deployment..."
HEALTH_CHECK_RESPONSE=$(curl -s ${API_URL}/health || echo "")
if echo "${HEALTH_CHECK_RESPONSE}" | grep -q '"status": "healthy"'; then
    print_success "API is healthy!"
    echo ""
    echo "Health check response:"
    echo "${HEALTH_CHECK_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${HEALTH_CHECK_RESPONSE}"
else
    print_warning "API health check returned unexpected response."
    echo "Response: ${HEALTH_CHECK_RESPONSE}"
    echo ""
    echo "This might be normal if the container is still starting up."
    echo "Please check the logs:"
    echo "  az containerapp logs show --name ${CONTAINER_APP} --resource-group ${RESOURCE_GROUP} --follow"
fi

echo ""
print_success "🎉 Deployment complete!"
echo ""
echo "Deployment Summary:"
echo "  Version: ${VERSION}"
echo "  Image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
echo "  API URL: ${API_URL}"
echo ""
echo "Test the API:"
echo "  curl ${API_URL}/health"
echo "  curl ${API_URL}/stats"
echo "  curl ${API_URL}/sample-vehicles"
echo ""
echo "View logs:"
echo "  az containerapp logs show --name ${CONTAINER_APP} --resource-group ${RESOURCE_GROUP} --follow"
echo ""
echo "Key Features:"
echo "  ✅ Clean architecture (extract → query once → search)"
echo "  ✅ Color matching (exterior color as HARD filter)"
echo "  ✅ Connection pooling"
echo "  ✅ Type-safe queries"
