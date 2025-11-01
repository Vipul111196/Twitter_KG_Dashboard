#!/bin/bash

# Import Twitter v2 dataset into Neo4j
# This script restores the database dump into a running Neo4j container

set -e

echo "🔄 Importing Twitter v2 dataset into Neo4j..."

# Check if Neo4j container is running
if ! docker ps | grep -q twitter-neo4j; then
    echo "❌ Error: Neo4j container is not running"
    echo "Please start Neo4j first: cd infrastructure && docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

# Stop Neo4j for import
echo "📦 Stopping Neo4j container..."
docker stop twitter-neo4j

# Copy dump file to Neo4j container
echo "📁 Copying dump file..."
docker cp infrastructure/import/twitter-v2-50.dump twitter-neo4j:/var/lib/neo4j/

# Load the dump file
echo "💾 Loading database dump..."
docker start twitter-neo4j
sleep 10

# Restore the database
docker exec twitter-neo4j neo4j-admin database load --from-path=/var/lib/neo4j/ twitter-v2-50 --overwrite-destination=true

# Set the default database
docker exec twitter-neo4j cypher-shell -u neo4j -p password "CREATE DATABASE twitter IF NOT EXISTS"

echo "✅ Data import completed successfully!"
echo "🌐 Access Neo4j Browser at: http://localhost:7474"
echo "📊 Username: neo4j"
echo "🔐 Password: password"

