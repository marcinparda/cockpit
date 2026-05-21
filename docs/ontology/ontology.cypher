// ============================================================
// COCKPIT ONTOLOGY — SCHEMA ONLY (no data)
// Node types + constraints + relationship types
// Run this BEFORE seed.cypher
// ============================================================

// --- Constraints (unique IDs per node type) ---

CREATE CONSTRAINT IF NOT EXISTS FOR (n:System) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Monorepo) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:BackendAPI) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:ServiceModule) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Router) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Endpoint) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Service) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Repository) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:DBModel) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Feature) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Action) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Permission) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Role) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:AuthFlow) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:OAuthFlow) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Session) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:RedisStore) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:MCPServer) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:MCPTool) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:MCPResource) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:ExternalService) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:FrontendApp) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Page) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Component) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:NxLib) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:ApiTypes) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Container) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:CIPipeline) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Registry) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:DeployTarget) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:VikunjaProject) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:VikunjaTask) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:BrainNote) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:CVPreset) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:CVSection) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:BudgetAccount) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:BudgetTransaction) REQUIRE n.id IS UNIQUE;

// --- Indexes ---

CREATE INDEX IF NOT EXISTS FOR (n:Endpoint) ON (n.method, n.path);
CREATE INDEX IF NOT EXISTS FOR (n:Permission) ON (n.name);
CREATE INDEX IF NOT EXISTS FOR (n:MCPTool) ON (n.group);
CREATE INDEX IF NOT EXISTS FOR (n:FrontendApp) ON (n.name);
CREATE INDEX IF NOT EXISTS FOR (n:ServiceModule) ON (n.name);

// ============================================================
// RELATIONSHIP TYPE REFERENCE (no CREATE — documentation only)
// ============================================================
//
// Platform
//   (System)-[:CONTAINS]->(Monorepo)
//   (Monorepo)-[:EXPOSES]->(BackendAPI)
//   (Monorepo)-[:CONTAINS]->(FrontendApp)
//
// Backend structure
//   (BackendAPI)-[:INCLUDES]->(ServiceModule)
//   (BackendAPI)-[:MOUNTS]->(MCPServer)
//   (ServiceModule)-[:HAS_ROUTER]->(Router)
//   (Router)-[:INCLUDES]->(Router)              // sub-routers
//   (Router)-[:EXPOSES]->(Endpoint)
//   (ServiceModule)-[:OWNS]->(DBModel)
//   (ServiceModule)-[:CALLS]->(ExternalService)
//   (ServiceModule)-[:READS_WRITES]->(RedisStore)
//
// Auth & Permissions
//   (Endpoint)-[:GUARDED_BY]->(Permission)
//   (Endpoint)-[:GUARDED_BY]->(Role)            // admin-only endpoints
//   (Permission)-[:COMBINES]->(Feature)
//   (Permission)-[:COMBINES]->(Action)
//
// MCP
//   (MCPServer)-[:REGISTERS]->(MCPTool)
//   (MCPServer)-[:REGISTERS]->(MCPResource)
//   (MCPServer)-[:AUTHENTICATED_VIA]->(OAuthFlow)
//   (MCPTool)-[:CALLS_SERVICE]->(ServiceModule)
//   (MCPTool)-[:CALLS_SERVICE]->(ExternalService)
//
// Frontend
//   (FrontendApp)-[:CALLS]->(Endpoint)
//   (FrontendApp)-[:USES]->(NxLib)
//   (FrontendApp)-[:AUTHENTICATED_VIA]->(AuthFlow)
//   (FrontendApp)-[:DEPLOYED_AS]->(Container)
//   (FrontendApp)-[:CONTAINS]->(Page)
//   (FrontendApp)-[:LINKS_TO]->(FrontendApp)
//   (FrontendApp)-[:REDIRECTS_TO]->(FrontendApp)
//   (Page)-[:REQUIRES]->(Permission)
//   (NxLib)-[:GENERATED_FROM]->(BackendAPI)
//
// Deployment
//   (Container)-[:BUILT_BY]->(CIPipeline)
//   (CIPipeline)-[:PUSHES_TO]->(Registry)
//   (CIPipeline)-[:TRIGGERS]->(CIPipeline)
//   (CIPipeline)-[:DEPLOYS_TO]->(DeployTarget)
