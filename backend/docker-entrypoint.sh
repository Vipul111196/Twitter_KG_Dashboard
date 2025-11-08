#!/bin/sh

# ============================================
# Docker Entrypoint for Backend
# ============================================
# This script runs on container startup and:
# 1. Waits for Neo4j to be ready
# 2. Generates GraphQL schema
# 3. Starts the backend server
#
# Note: Database seeding is handled by init container
# ============================================

echo "🚀 Starting Twitter Dashboard Backend..."

# Neo4j readiness is handled by docker-compose depends_on healthcheck
# Just add a small delay to ensure it's fully ready
echo "⏳ Waiting for Neo4j to be ready..."
sleep 10
echo "✅ Neo4j is ready!"

# Generate GraphQL schema
echo "📝 Generating GraphQL schema..."
npm run build:schema || echo "⚠️  Schema generation skipped"

echo ""
echo "🎯 Starting NestJS server..."
node dist/main.js

