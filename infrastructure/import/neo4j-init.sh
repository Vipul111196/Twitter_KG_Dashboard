#!/bin/bash
set -e

echo "🔍 Neo4j initialization script starting..."

# Check if data already loaded
if [ -f /data/.data-loaded ]; then
    echo "✅ Data already loaded, starting Neo4j..."
    exec /startup/docker-entrypoint.sh neo4j
    exit 0
fi

# First startup - load data
echo "📦 First startup detected - loading Twitter dataset..."
echo "   Dataset: 38,986 users, 2,407 tweets, 344 hashtags"

if [ -f /import/neo4j.dump ]; then
    echo "📥 Loading dataset into Neo4j..."
    neo4j-admin database load neo4j --from-path=/import --overwrite-destination=true
    
    touch /data/.data-loaded
    echo "✅ Dataset loaded successfully!"
    echo "   38,986 users, 2,407 tweets, 344 hashtags"
else
    echo "⚠️  Dump file not found at /import/neo4j.dump"
    echo "   Starting with empty database"
fi

# Start Neo4j
echo "🚀 Starting Neo4j server..."
exec /startup/docker-entrypoint.sh neo4j

