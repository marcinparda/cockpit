---
name: graph
description: Query the cockpit knowledge graph in Neo4j to answer architectural questions about the project
allowed-tools: [mcp__neo4j__query, Bash]
---

Query the cockpit project knowledge graph (Neo4j) to answer questions about architecture, endpoints, permissions, MCP tools, deployment, and app structure.

## When to use

Use this skill when asked questions like:
- Which endpoints does module X expose?
- What permissions guard endpoint Y?
- Which MCP tools call service Z?
- How is frontend app X connected to the backend?
- What is Redis used for?
- How does deployment work?
- What is the purpose of app X?
- Which features/permissions does role X grant?
- How are apps connected to each other?

## Graph location

Neo4j running locally at `bolt://localhost:7687` (started via `docs/ontology/neo4j-setup.sh`).

If Neo4j is not running, tell the user to run:
```bash
cd <repo root>
./docs/ontology/neo4j-setup.sh
```

## Node types in graph

| Type | What it represents |
|------|--------------------|
| System | The cockpit monorepo |
| Monorepo | cockpit-api or cockpit-app |
| BackendAPI | Single FastAPI app |
| ServiceModule | A bounded module (authentication, brain, vikunja, etc.) |
| Router | FastAPI APIRouter |
| Endpoint | Single HTTP route (method + path) |
| DBModel | SQLModel ORM class |
| Feature | Permission domain (brain, vikunja, redis_store, users, roles) |
| Action | CRUD verb (create, read, update, delete) |
| Permission | Feature × Action (e.g. brain:read) |
| Role | Admin or User |
| AuthFlow | Cookie-based session auth |
| OAuthFlow | OAuth2 for MCP clients |
| RedisStore | Redis instance |
| MCPServer | FastMCP server at /mcp |
| MCPTool | Individual MCP callable |
| MCPResource | MCP readable resource |
| ExternalService | Vikunja, Actual Budget, Git, LiteLLM, Hermes |
| FrontendApp | login, cockpit, cv, store |
| Page | Routed view in a frontend app |
| NxLib | Shared Nx library |
| Container | Docker container on Raspberry Pi |
| CIPipeline | GitHub Actions workflow |
| DeployTarget | Raspberry Pi |

## Key relationship types

```
(Router)-[:EXPOSES]->(Endpoint)
(Endpoint)-[:GUARDED_BY]->(Permission|Role)
(Permission)-[:COMBINES]->(Feature)
(Permission)-[:COMBINES]->(Action)
(MCPTool)-[:CALLS_SERVICE]->(ServiceModule|ExternalService)
(FrontendApp)-[:CALLS]->(Endpoint)
(FrontendApp)-[:AUTHENTICATED_VIA]->(AuthFlow)
(FrontendApp)-[:DEPLOYED_AS]->(Container)
(CIPipeline)-[:TRIGGERS]->(CIPipeline)
(CIPipeline)-[:DEPLOYS_TO]->(DeployTarget)
(Page)-[:REQUIRES]->(Permission)
```

## Example queries

```cypher
// All endpoints with their permission guards
MATCH (e:Endpoint)-[:GUARDED_BY]->(p) RETURN e.method, e.path, p.name ORDER BY e.path

// MCP tools grouped by domain
MATCH (t:MCPTool) RETURN t.group, collect(t.name) ORDER BY t.group

// Which frontend apps call which endpoints
MATCH (a:FrontendApp)-[:CALLS]->(e:Endpoint) RETURN a.name, e.method, e.path ORDER BY a.name

// Full deployment pipeline
MATCH path = (ci:CIPipeline)-[:TRIGGERS|DEPLOYS_TO*]->(n) RETURN path

// All permissions for a feature
MATCH (p:Permission)-[:COMBINES]->(f:Feature {name:'brain'}) RETURN p.name

// What Redis is used for
MATCH (s)-[:READS_WRITES]->(r:RedisStore) RETURN s.name, r.usedFor
```

## Instructions

1. Identify what the user wants to know
2. Pick the right Cypher query (or compose one) from the patterns above
3. Run it via the neo4j MCP tool
4. Present results in a clear table or explanation
5. If the graph doesn't have the answer, fall back to reading source code
