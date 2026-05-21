#!/usr/bin/env bash
# Step 7: Start Neo4j and load ontology + seed data

set -e

NEO4J_PASSWORD="cockpit123"
CONTAINER_NAME="cockpit-neo4j"
ONTOLOGY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Starting Neo4j..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH="neo4j/${NEO4J_PASSWORD}" \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:5

echo "==> Waiting for Neo4j to be ready..."
until docker exec "$CONTAINER_NAME" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "RETURN 1" > /dev/null 2>&1; do
  sleep 2
  echo "   still waiting..."
done
echo "   Neo4j ready."

echo "==> Loading ontology schema..."
docker exec -i "$CONTAINER_NAME" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
  < "$ONTOLOGY_DIR/ontology.cypher"

echo "==> Loading seed data..."
docker exec -i "$CONTAINER_NAME" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
  < "$ONTOLOGY_DIR/seed.cypher"

echo ""
echo "Done! Neo4j browser: http://localhost:7474"
echo "Username: neo4j  Password: ${NEO4J_PASSWORD}"
echo ""
echo "Useful starter queries:"
echo "  MATCH (n) RETURN n LIMIT 50"
echo "  MATCH (r:Router)-[:EXPOSES]->(e:Endpoint) RETURN r.name, e.method, e.path"
echo "  MATCH (t:MCPTool)-[:CALLS_SERVICE]->(s) RETURN t.name, t.group, s.name"
echo "  MATCH (e:Endpoint)-[:GUARDED_BY]->(p) RETURN e.path, p.name ORDER BY e.path"
echo "  MATCH (a:FrontendApp)-[:CALLS]->(e:Endpoint) RETURN a.name, e.method, e.path"
