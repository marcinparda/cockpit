// ============================================================
// COCKPIT SEED DATA — generated from codebase analysis
// Run AFTER ontology.cypher
// ============================================================

// --- System ---
MERGE (:System {id: 'system:cockpit', name: 'cockpit', description: 'Personal agent platform — self-hosted on Raspberry Pi', repository: 'github.com/marcinparda/cockpit'});

// --- Monorepos ---
MERGE (:Monorepo {id: 'monorepo:api', name: 'cockpit-api', language: 'Python 3.12', framework: 'FastAPI', path: 'cockpit-api/'});
MERGE (:Monorepo {id: 'monorepo:app', name: 'cockpit-app', language: 'TypeScript 5.8', framework: 'Nx 21', path: 'cockpit-app/'});

// --- Backend API ---
MERGE (:BackendAPI {id: 'api:main', name: 'cockpit-api', basePath: '/api/v1', framework: 'FastAPI', language: 'Python'});

// --- Service Modules ---
MERGE (:ServiceModule {id: 'module:authentication', name: 'authentication', path: 'src/services/authentication', hasExternalDependency: false});
MERGE (:ServiceModule {id: 'module:authorization', name: 'authorization', path: 'src/services/authorization', hasExternalDependency: false});
MERGE (:ServiceModule {id: 'module:users', name: 'users', path: 'src/services/users', hasExternalDependency: false});
MERGE (:ServiceModule {id: 'module:oauth', name: 'oauth', path: 'src/services/oauth', hasExternalDependency: false});
MERGE (:ServiceModule {id: 'module:brain', name: 'brain', path: 'src/services/brain', hasExternalDependency: true});
MERGE (:ServiceModule {id: 'module:redis_store', name: 'redis_store', path: 'src/services/redis_store', hasExternalDependency: true});
MERGE (:ServiceModule {id: 'module:vikunja', name: 'vikunja', path: 'src/services/vikunja', hasExternalDependency: true});
MERGE (:ServiceModule {id: 'module:health', name: 'health', path: 'src/services/health', hasExternalDependency: false});
MERGE (:ServiceModule {id: 'module:mcp', name: 'mcp', path: 'src/services/mcp', hasExternalDependency: true});

// --- Routers ---
MERGE (:Router {id: 'router:authentication', name: 'authentication_router', prefix: '/api/v1/authentication', tags: ['authentication']});
MERGE (:Router {id: 'router:auth_sessions', name: 'sessions_router', prefix: '/api/v1/authentication/sessions', tags: ['authentication/sessions']});
MERGE (:Router {id: 'router:auth_tokens', name: 'tokens_router', prefix: '/api/v1/authentication/tokens', tags: ['authentication/tokens']});
MERGE (:Router {id: 'router:auth_passwords', name: 'passwords_router', prefix: '/api/v1/authentication/passwords', tags: ['authentication/passwords']});
MERGE (:Router {id: 'router:authorization', name: 'authorization_router', prefix: '/api/v1/authorization', tags: ['authorization']});
MERGE (:Router {id: 'router:users', name: 'users_router', prefix: '/api/v1/users', tags: ['users']});
MERGE (:Router {id: 'router:oauth', name: 'oauth_router', prefix: '/api/v1/oauth', tags: ['oauth']});
MERGE (:Router {id: 'router:brain', name: 'brain_router', prefix: '/api/v1/brain', tags: ['brain']});
MERGE (:Router {id: 'router:redis_store', name: 'redis_store_router', prefix: '/api/v1/store', tags: ['redis_store']});
MERGE (:Router {id: 'router:vikunja', name: 'vikunja_router', prefix: '/api/v1/vikunja', tags: ['vikunja']});
MERGE (:Router {id: 'router:health', name: 'health_router', prefix: '/api/v1/health', tags: ['health']});

// --- Endpoints: Authentication ---
MERGE (:Endpoint {id: 'endpoint:post_login', method: 'POST', path: '/api/v1/authentication/sessions/login', responseModel: 'LoginResponse', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:post_logout', method: 'POST', path: '/api/v1/authentication/sessions/logout', responseModel: 'LogoutResponse', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:post_refresh', method: 'POST', path: '/api/v1/authentication/tokens/refresh', responseModel: 'SimpleRefreshResponse', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:post_password_change', method: 'POST', path: '/api/v1/authentication/passwords/change', responseModel: 'PasswordChangeResponse', statusCode: 200, requiresAuth: true});

// --- Endpoints: Users ---
MERGE (:Endpoint {id: 'endpoint:get_me', method: 'GET', path: '/api/v1/users/me', responseModel: 'UserInfoResponse', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_users', method: 'GET', path: '/api/v1/users', responseModel: 'List[SimpleUserResponse]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:post_user', method: 'POST', path: '/api/v1/users', responseModel: 'UserSchema', statusCode: 201, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:put_user', method: 'PUT', path: '/api/v1/users/{user_id}', responseModel: 'UserSchema', statusCode: 200, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:delete_user', method: 'DELETE', path: '/api/v1/users/{user_id}', statusCode: 204, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:put_user_role', method: 'PUT', path: '/api/v1/users/{user_id}/role', responseModel: 'UserWithRole', statusCode: 200, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:post_user_permissions', method: 'POST', path: '/api/v1/users/{user_id}/permissions', statusCode: 201, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:delete_user_permission', method: 'DELETE', path: '/api/v1/users/{user_id}/permissions/{permission_id}', statusCode: 204, requiresAuth: true, adminOnly: true});
MERGE (:Endpoint {id: 'endpoint:get_user_permissions', method: 'GET', path: '/api/v1/users/{user_id}/permissions', responseModel: 'List[Permission]', statusCode: 200, requiresAuth: true, adminOnly: true});

// --- Endpoints: Authorization ---
MERGE (:Endpoint {id: 'endpoint:get_my_roles', method: 'GET', path: '/api/v1/authorization/roles/me', responseModel: 'List[UserRole]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_my_permissions', method: 'GET', path: '/api/v1/authorization/user-permissions/me', responseModel: 'List[Permission]', statusCode: 200, requiresAuth: true});

// --- Endpoints: Brain ---
MERGE (:Endpoint {id: 'endpoint:get_brain_notes', method: 'GET', path: '/api/v1/brain/notes', responseModel: 'list[NoteMeta]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:post_brain_note', method: 'POST', path: '/api/v1/brain/notes', responseModel: 'Note', statusCode: 201, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_brain_note', method: 'GET', path: '/api/v1/brain/notes/{path}', responseModel: 'Note', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:put_brain_note', method: 'PUT', path: '/api/v1/brain/notes/{path}', responseModel: 'Note', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:delete_brain_note', method: 'DELETE', path: '/api/v1/brain/notes/{path}', statusCode: 204, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_brain_folders', method: 'GET', path: '/api/v1/brain/folders', responseModel: 'FolderTree', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_brain_search', method: 'GET', path: '/api/v1/brain/search', responseModel: 'list[NoteSearchResult]', statusCode: 200, requiresAuth: true});

// --- Endpoints: Redis Store ---
MERGE (:Endpoint {id: 'endpoint:get_store_prefixes', method: 'GET', path: '/api/v1/store/', responseModel: 'list[str]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_store_categories', method: 'GET', path: '/api/v1/store/{prefix}', responseModel: 'list[str]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_store_keys', method: 'GET', path: '/api/v1/store/{prefix}/{category}', responseModel: 'list[str]', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_store_value', method: 'GET', path: '/api/v1/store/{prefix}/{category}/{key}', responseModel: 'StoreEnvelope', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:put_store_value', method: 'PUT', path: '/api/v1/store/{prefix}/{category}/{key}', responseModel: 'StoreEnvelope', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:patch_store_value', method: 'PATCH', path: '/api/v1/store/{prefix}/{category}/{key}', responseModel: 'StoreEnvelope', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:delete_store_value', method: 'DELETE', path: '/api/v1/store/{prefix}/{category}/{key}', statusCode: 204, requiresAuth: true});

// --- Endpoints: Vikunja ---
MERGE (:Endpoint {id: 'endpoint:get_vikunja_projects', method: 'GET', path: '/api/v1/vikunja/projects', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:get_vikunja_tasks', method: 'GET', path: '/api/v1/vikunja/projects/{project_id}/tasks', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:post_vikunja_task', method: 'POST', path: '/api/v1/vikunja/tasks', statusCode: 201, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:patch_vikunja_task', method: 'PATCH', path: '/api/v1/vikunja/tasks/{task_id}', statusCode: 200, requiresAuth: true});

// --- Endpoints: OAuth ---
MERGE (:Endpoint {id: 'endpoint:get_oauth_authorize', method: 'GET', path: '/api/v1/oauth/authorize', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:post_oauth_authorize', method: 'POST', path: '/api/v1/oauth/authorize', statusCode: 200, requiresAuth: true});
MERGE (:Endpoint {id: 'endpoint:post_oauth_token', method: 'POST', path: '/api/v1/oauth/token', responseModel: 'TokenResponse', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:post_oauth_clients', method: 'POST', path: '/api/v1/oauth/clients', responseModel: 'ClientRegistrationResponse', statusCode: 201, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:get_oauth_metadata', method: 'GET', path: '/.well-known/oauth-authorization-server', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:get_oauth_resource', method: 'GET', path: '/.well-known/oauth-protected-resource', statusCode: 200, requiresAuth: false});

// --- Endpoints: Health ---
MERGE (:Endpoint {id: 'endpoint:get_health', method: 'GET', path: '/api/v1/health', responseModel: 'HealthCheckResponse', statusCode: 200, requiresAuth: false});
MERGE (:Endpoint {id: 'endpoint:get_health_cleanup', method: 'GET', path: '/api/v1/health/cleanup', responseModel: 'CleanupHealthResponse', statusCode: 200, requiresAuth: false});

// --- DB Models ---
MERGE (:DBModel {id: 'model:user', name: 'User', tableName: 'users', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:permission', name: 'Permission', tableName: 'permissions', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:user_permission', name: 'UserPermission', tableName: 'user_permissions', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:user_role', name: 'UserRole', tableName: 'user_roles', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:access_token', name: 'AccessToken', tableName: 'access_tokens', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:refresh_token', name: 'RefreshToken', tableName: 'refresh_tokens', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:oauth_client', name: 'OAuthClient', tableName: 'oauth_clients', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:oauth_auth_code', name: 'OAuthAuthorizationCode', tableName: 'oauth_authorization_codes', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:oauth_access_token', name: 'OAuthAccessToken', tableName: 'oauth_access_tokens', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:feature', name: 'Feature', tableName: 'features', primaryKey: 'UUID'});
MERGE (:DBModel {id: 'model:action', name: 'Action', tableName: 'actions', primaryKey: 'UUID'});

// --- Roles ---
MERGE (:Role {id: 'role:admin', name: 'Admin', description: 'Full access — can manage users, roles, permissions. Auto-assigned all permissions on migration.'});
MERGE (:Role {id: 'role:user', name: 'User', description: 'Standard access — assigned permissions individually by admin.'});

// --- Features (permission domains) ---
MERGE (:Feature {id: 'feature:roles', name: 'roles', description: 'Role management'});
MERGE (:Feature {id: 'feature:users', name: 'users', description: 'User management'});
MERGE (:Feature {id: 'feature:redis_store', name: 'redis_store', description: 'Redis key-value store'});
MERGE (:Feature {id: 'feature:brain', name: 'brain', description: 'Brain notes'});
MERGE (:Feature {id: 'feature:vikunja', name: 'vikunja', description: 'Vikunja task management'});

// --- Actions ---
MERGE (:Action {id: 'action:create', name: 'create'});
MERGE (:Action {id: 'action:read', name: 'read'});
MERGE (:Action {id: 'action:update', name: 'update'});
MERGE (:Action {id: 'action:delete', name: 'delete'});

// --- Permissions ---
MERGE (:Permission {id: 'perm:roles:create', name: 'roles:create', feature: 'roles', action: 'create'});
MERGE (:Permission {id: 'perm:roles:read', name: 'roles:read', feature: 'roles', action: 'read'});
MERGE (:Permission {id: 'perm:roles:update', name: 'roles:update', feature: 'roles', action: 'update'});
MERGE (:Permission {id: 'perm:roles:delete', name: 'roles:delete', feature: 'roles', action: 'delete'});
MERGE (:Permission {id: 'perm:users:create', name: 'users:create', feature: 'users', action: 'create'});
MERGE (:Permission {id: 'perm:users:read', name: 'users:read', feature: 'users', action: 'read'});
MERGE (:Permission {id: 'perm:users:update', name: 'users:update', feature: 'users', action: 'update'});
MERGE (:Permission {id: 'perm:users:delete', name: 'users:delete', feature: 'users', action: 'delete'});
MERGE (:Permission {id: 'perm:redis_store:create', name: 'redis_store:create', feature: 'redis_store', action: 'create'});
MERGE (:Permission {id: 'perm:redis_store:read', name: 'redis_store:read', feature: 'redis_store', action: 'read'});
MERGE (:Permission {id: 'perm:redis_store:update', name: 'redis_store:update', feature: 'redis_store', action: 'update'});
MERGE (:Permission {id: 'perm:redis_store:delete', name: 'redis_store:delete', feature: 'redis_store', action: 'delete'});
MERGE (:Permission {id: 'perm:brain:create', name: 'brain:create', feature: 'brain', action: 'create'});
MERGE (:Permission {id: 'perm:brain:read', name: 'brain:read', feature: 'brain', action: 'read'});
MERGE (:Permission {id: 'perm:brain:update', name: 'brain:update', feature: 'brain', action: 'update'});
MERGE (:Permission {id: 'perm:brain:delete', name: 'brain:delete', feature: 'brain', action: 'delete'});
MERGE (:Permission {id: 'perm:vikunja:create', name: 'vikunja:create', feature: 'vikunja', action: 'create'});
MERGE (:Permission {id: 'perm:vikunja:read', name: 'vikunja:read', feature: 'vikunja', action: 'read'});
MERGE (:Permission {id: 'perm:vikunja:update', name: 'vikunja:update', feature: 'vikunja', action: 'update'});
MERGE (:Permission {id: 'perm:vikunja:delete', name: 'vikunja:delete', feature: 'vikunja', action: 'delete'});

// --- Auth Flows ---
MERGE (:AuthFlow {id: 'auth:cookie_session', name: 'cookie_session', mechanism: 'HttpOnly cookie', tokenStorage: 'PostgreSQL (access+refresh tokens)', refreshStrategy: 'POST /api/v1/authentication/tokens/refresh'});
MERGE (:OAuthFlow {id: 'auth:oauth2', name: 'oauth2_auth_code', grantType: 'authorization_code', endpoint: '/api/v1/oauth'});

// --- Redis ---
MERGE (:RedisStore {id: 'redis:main', name: 'Redis', usedFor: 'MCP OAuth tokens, Vikunja token cache, CV presets, generic key-value store'});

// --- MCP Server ---
MERGE (:MCPServer {id: 'mcp:server', name: 'cockpit-mcp', mountPath: '/mcp', authType: 'OAuth2 authorization_code'});

// --- MCP Tools: Brain ---
MERGE (:MCPTool {id: 'mcptool:brain_search_notes', name: 'brain_search_notes', group: 'brain', description: 'Full-text search across brain notes with type/tag filters'});
MERGE (:MCPTool {id: 'mcptool:brain_get_note', name: 'brain_get_note', group: 'brain', description: 'Read brain note by relative path'});
MERGE (:MCPTool {id: 'mcptool:brain_list_notes', name: 'brain_list_notes', group: 'brain', description: 'List brain notes metadata with optional filters'});
MERGE (:MCPTool {id: 'mcptool:brain_list_folders', name: 'brain_list_folders', group: 'brain', description: 'List all folders in brain notes directory'});
MERGE (:MCPTool {id: 'mcptool:brain_create_note', name: 'brain_create_note', group: 'brain', description: 'Create brain note and auto git commit+push'});
MERGE (:MCPTool {id: 'mcptool:brain_update_note', name: 'brain_update_note', group: 'brain', description: 'Update brain note fields and auto git commit+push'});
MERGE (:MCPTool {id: 'mcptool:brain_delete_note', name: 'brain_delete_note', group: 'brain', description: 'Delete brain note and auto git commit+push'});

// --- MCP Tools: Budget ---
MERGE (:MCPTool {id: 'mcptool:actual_list_accounts', name: 'actual_list_accounts', group: 'budget', description: 'List all Actual Budget accounts'});
MERGE (:MCPTool {id: 'mcptool:actual_create_account', name: 'actual_create_account', group: 'budget', description: 'Create new budget account (on-budget or off-budget)'});
MERGE (:MCPTool {id: 'mcptool:actual_list_categories', name: 'actual_list_categories', group: 'budget', description: 'List budget categories and groups'});
MERGE (:MCPTool {id: 'mcptool:actual_list_payees', name: 'actual_list_payees', group: 'budget', description: 'List all payees/merchants'});
MERGE (:MCPTool {id: 'mcptool:actual_search_transactions', name: 'actual_search_transactions', group: 'budget', description: 'Search transactions by account and date range; enriches with category names'});
MERGE (:MCPTool {id: 'mcptool:actual_create_transaction', name: 'actual_create_transaction', group: 'budget', description: 'Create single transaction; amount in integer cents, negative=expense'});
MERGE (:MCPTool {id: 'mcptool:actual_batch_create_transactions', name: 'actual_batch_create_transactions', group: 'budget', description: 'Batch import transactions (bank statement import use case)'});
MERGE (:MCPTool {id: 'mcptool:actual_update_transaction', name: 'actual_update_transaction', group: 'budget', description: 'Update transaction category, payee, notes, cleared status'});
MERGE (:MCPTool {id: 'mcptool:actual_delete_transaction', name: 'actual_delete_transaction', group: 'budget', description: 'Permanently delete transaction by ID'});

// --- MCP Tools: Tasks ---
MERGE (:MCPTool {id: 'mcptool:vikunja_list_projects', name: 'vikunja_list_projects', group: 'tasks', description: 'List all Vikunja projects'});
MERGE (:MCPTool {id: 'mcptool:vikunja_get_tasks', name: 'vikunja_get_tasks', group: 'tasks', description: 'Get tasks with filter expressions (due_date, done, priority), sort, search, pagination'});
MERGE (:MCPTool {id: 'mcptool:vikunja_create_task', name: 'vikunja_create_task', group: 'tasks', description: 'Create task in Vikunja project with title, description, due date, priority, assignees'});
MERGE (:MCPTool {id: 'mcptool:vikunja_update_task', name: 'vikunja_update_task', group: 'tasks', description: 'Update task fields (done, due date, title, description, priority)'});
MERGE (:MCPTool {id: 'mcptool:vikunja_delete_task', name: 'vikunja_delete_task', group: 'tasks', description: 'Permanently delete task'});
MERGE (:MCPTool {id: 'mcptool:vikunja_assign_user_to_task', name: 'vikunja_assign_user_to_task', group: 'tasks', description: 'Assign Vikunja user to task'});
MERGE (:MCPTool {id: 'mcptool:vikunja_remove_assignee', name: 'vikunja_remove_assignee', group: 'tasks', description: 'Remove user assignment from task'});
MERGE (:MCPTool {id: 'mcptool:vikunja_list_users', name: 'vikunja_list_users', group: 'tasks', description: 'Search Vikunja users by name/username/email to get IDs for assignment'});

// --- MCP Tools: CV ---
MERGE (:MCPTool {id: 'mcptool:search_company', name: 'search_company', group: 'cv', description: 'Web search for company culture, values, tech stack and buzzwords to tailor CV language'});
MERGE (:MCPTool {id: 'mcptool:get_cv_base_preset', name: 'get_cv_base_preset', group: 'cv', description: 'Read all sections from base CV preset — always call before tailoring'});
MERGE (:MCPTool {id: 'mcptool:preview_cv_preset', name: 'preview_cv_preset', group: 'cv', description: 'Preview tailored CV preset WITHOUT saving — show user for confirmation'});
MERGE (:MCPTool {id: 'mcptool:save_cv_preset', name: 'save_cv_preset', group: 'cv', description: 'Save confirmed CV preset to redis_store — call only after user confirms preview'});

// --- MCP Tools: Hermes ---
MERGE (:MCPTool {id: 'mcptool:hermes_get_model', name: 'hermes_get_model', group: 'hermes', description: 'Get current default model configured for Hermes agent'});
MERGE (:MCPTool {id: 'mcptool:hermes_set_model', name: 'hermes_set_model', group: 'hermes', description: 'Set default model for Hermes agent (OpenRouter model ID) and restart it'});

// --- MCP Resources ---
MERGE (:MCPResource {id: 'mcpresource:brain_notes', name: 'brain_notes', description: 'Brain notes readable as MCP resources', uriPattern: 'brain://notes/{path}'});

// --- External Services ---
MERGE (:ExternalService {id: 'ext:vikunja', name: 'Vikunja', serviceType: 'Task Management', authMethod: 'API token cached in Redis', note: 'Users created manually in Vikunja — separate from cockpit users'});
MERGE (:ExternalService {id: 'ext:actual', name: 'Actual Budget HTTP API', serviceType: 'Personal Finance', authMethod: 'X-Api-Key header', note: 'Separate Actual Budget instance — accounts managed within Actual'});
MERGE (:ExternalService {id: 'ext:litellm', name: 'LiteLLM Proxy', serviceType: 'LLM Gateway', authMethod: 'Bearer token', note: 'Routes all AI traffic: Claude Code, Kiro, Hermes, Open WebUI'});
MERGE (:ExternalService {id: 'ext:hermes', name: 'Hermes Agent', serviceType: 'AI Assistant', authMethod: 'local config file', note: 'Model configurable via MCP hermes_set_model tool'});
MERGE (:ExternalService {id: 'ext:git', name: 'Git', serviceType: 'Version Control', authMethod: 'SSH key', note: 'Used by brain service to commit+push note changes automatically'});

// --- Frontend Apps ---
MERGE (:FrontendApp {id: 'app:login', name: 'login', framework: 'React 19', path: 'cockpit-app/apps/login', purpose: 'Authentication UI — login form and password change. Redirects to cockpit on success.', requiresAuth: false, port: 4201});
MERGE (:FrontendApp {id: 'app:cockpit', name: 'cockpit', framework: 'React 19', path: 'cockpit-app/apps/cockpit', purpose: 'Personal dashboard — task overview and hub linking to all other apps', requiresAuth: true, port: 4200});
MERGE (:FrontendApp {id: 'app:cv', name: 'cv', framework: 'Vue 3.5', path: 'cockpit-app/apps/cv', purpose: 'CV editor and preset manager — create and tailor CV variants for job applications', requiresAuth: true, port: 4202});
MERGE (:FrontendApp {id: 'app:store', name: 'store', framework: 'Angular 19', path: 'cockpit-app/apps/store', purpose: 'Redis key-value store browser — inspect and manage stored data (including CV presets)', requiresAuth: true, port: 4203});

// --- Pages ---
MERGE (:Page {id: 'page:login', name: 'LoginPage', path: '/', app: 'login', framework: 'React'});
MERGE (:Page {id: 'page:cockpit_dashboard', name: 'DashboardPage', path: '/', app: 'cockpit', framework: 'React'});
MERGE (:Page {id: 'page:cv_editor', name: 'CVEditorPage', path: '/', app: 'cv', framework: 'Vue'});
MERGE (:Page {id: 'page:store_browser', name: 'StoreBrowserPage', path: '/', app: 'store', framework: 'Angular', requiresPermission: 'redis_store:read'});

// --- Nx Libraries ---
MERGE (:NxLib {id: 'lib:shared_ui_react', name: 'shared-ui-react', path: 'cockpit-app/libs/shared/ui/react', libType: 'ui', scope: 'shared', framework: 'React'});
MERGE (:NxLib {id: 'lib:shared_data_access_common', name: 'shared-data-access-common', path: 'cockpit-app/libs/shared/data-access/common', libType: 'data-access', scope: 'shared', framework: 'agnostic'});
MERGE (:NxLib {id: 'lib:shared_data_access_react', name: 'shared-data-access-react', path: 'cockpit-app/libs/shared/data-access/react', libType: 'data-access', scope: 'shared', framework: 'React'});
MERGE (:NxLib {id: 'lib:shared_feature_react', name: 'shared-feature-react', path: 'cockpit-app/libs/shared/feature/react', libType: 'feature', scope: 'shared', framework: 'React'});
MERGE (:NxLib {id: 'lib:shared_types_api_types', name: 'shared-types-api-types', path: 'cockpit-app/libs/shared/types/api-types', libType: 'types', scope: 'shared', framework: 'agnostic', packageAlias: '@cockpit-app/api-types'});
MERGE (:NxLib {id: 'lib:shared_utils', name: 'shared-utils', path: 'cockpit-app/libs/shared/utils', libType: 'util', scope: 'shared', framework: 'agnostic'});
MERGE (:NxLib {id: 'lib:cockpit_ui', name: 'cockpit-ui', path: 'cockpit-app/libs/cockpit/ui', libType: 'ui', scope: 'cockpit', framework: 'React'});

// --- ApiTypes ---
MERGE (:ApiTypes {id: 'apitypes:main', name: 'api-types', generatedFrom: 'cockpit-api OpenAPI spec', packageAlias: '@cockpit-app/api-types'});

// --- Containers ---
MERGE (:Container {id: 'container:api', name: 'cockpit-api', image: 'ghcr.io/marcinparda/cockpit:latest', architecture: 'linux/arm64', port: 8000, baseImage: 'python:3.12-slim'});
MERGE (:Container {id: 'container:login', name: 'cockpit-login', image: 'ghcr.io/marcinparda/cockpit-login:latest', architecture: 'linux/arm64', port: 80, baseImage: 'nginx:alpine'});
MERGE (:Container {id: 'container:cockpit', name: 'cockpit-app', image: 'ghcr.io/marcinparda/cockpit-cockpit:latest', architecture: 'linux/arm64', port: 80, baseImage: 'nginx:alpine'});
MERGE (:Container {id: 'container:cv', name: 'cockpit-cv', image: 'ghcr.io/marcinparda/cockpit-cv:latest', architecture: 'linux/arm64', port: 80, baseImage: 'nginx:alpine'});
MERGE (:Container {id: 'container:store', name: 'cockpit-store', image: 'ghcr.io/marcinparda/cockpit-store:latest', architecture: 'linux/arm64', port: 80, baseImage: 'nginx:alpine'});

// --- CI Pipelines ---
MERGE (:CIPipeline {id: 'ci:api_deploy', name: 'Deploy API', file: 'api-deploy.yml', trigger: 'push to master with cockpit-api/** changes', type: 'build+push'});
MERGE (:CIPipeline {id: 'ci:api_deploy_prod', name: 'Deploy API to Production', file: 'api-deploy-to-production.yml', trigger: 'Deploy API workflow completes on master', type: 'deploy'});
MERGE (:CIPipeline {id: 'ci:app_deploy', name: 'Deploy App', file: 'app-deploy.yml', trigger: 'push to master with cockpit-app/** changes', type: 'build+push'});
MERGE (:CIPipeline {id: 'ci:app_deploy_prod', name: 'Deploy App to Production', file: 'app-deploy-to-production.yml', trigger: 'Deploy App workflow completes on master', type: 'deploy'});

// --- Registry & Target ---
MERGE (:Registry {id: 'registry:ghcr', name: 'GitHub Container Registry', url: 'ghcr.io/marcinparda'});
MERGE (:DeployTarget {id: 'target:pi', name: 'Raspberry Pi', architecture: 'arm64', accessMethod: 'SSH via Cloudflare Tunnel', deployMechanism: 'shell scripts run via nohup, result polled from /tmp/deploy.exit'});

// ============================================================
// RELATIONSHIPS
// ============================================================

// System structure
MATCH (s:System {id:'system:cockpit'}), (m:Monorepo {id:'monorepo:api'}) MERGE (s)-[:CONTAINS]->(m);
MATCH (s:System {id:'system:cockpit'}), (m:Monorepo {id:'monorepo:app'}) MERGE (s)-[:CONTAINS]->(m);
MATCH (m:Monorepo {id:'monorepo:api'}), (a:BackendAPI {id:'api:main'}) MERGE (m)-[:EXPOSES]->(a);
MATCH (m:Monorepo {id:'monorepo:app'}), (a:FrontendApp {id:'app:login'}) MERGE (m)-[:CONTAINS]->(a);
MATCH (m:Monorepo {id:'monorepo:app'}), (a:FrontendApp {id:'app:cockpit'}) MERGE (m)-[:CONTAINS]->(a);
MATCH (m:Monorepo {id:'monorepo:app'}), (a:FrontendApp {id:'app:cv'}) MERGE (m)-[:CONTAINS]->(a);
MATCH (m:Monorepo {id:'monorepo:app'}), (a:FrontendApp {id:'app:store'}) MERGE (m)-[:CONTAINS]->(a);

// Backend API → Modules
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:authentication'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:authorization'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:users'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:oauth'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:brain'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:redis_store'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:vikunja'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:health'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (m:ServiceModule {id:'module:mcp'}) MERGE (a)-[:INCLUDES]->(m);
MATCH (a:BackendAPI {id:'api:main'}), (mcp:MCPServer {id:'mcp:server'}) MERGE (a)-[:MOUNTS]->(mcp);

// Modules → Routers
MATCH (m:ServiceModule {id:'module:authentication'}), (r:Router {id:'router:authentication'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (r1:Router {id:'router:authentication'}), (r2:Router {id:'router:auth_sessions'}) MERGE (r1)-[:INCLUDES]->(r2);
MATCH (r1:Router {id:'router:authentication'}), (r2:Router {id:'router:auth_tokens'}) MERGE (r1)-[:INCLUDES]->(r2);
MATCH (r1:Router {id:'router:authentication'}), (r2:Router {id:'router:auth_passwords'}) MERGE (r1)-[:INCLUDES]->(r2);
MATCH (m:ServiceModule {id:'module:authorization'}), (r:Router {id:'router:authorization'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:users'}), (r:Router {id:'router:users'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:oauth'}), (r:Router {id:'router:oauth'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:brain'}), (r:Router {id:'router:brain'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:redis_store'}), (r:Router {id:'router:redis_store'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:vikunja'}), (r:Router {id:'router:vikunja'}) MERGE (m)-[:HAS_ROUTER]->(r);
MATCH (m:ServiceModule {id:'module:health'}), (r:Router {id:'router:health'}) MERGE (m)-[:HAS_ROUTER]->(r);

// Routers → Endpoints
MATCH (r:Router {id:'router:auth_sessions'}), (e:Endpoint {id:'endpoint:post_login'}) MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:auth_sessions'}), (e:Endpoint {id:'endpoint:post_logout'}) MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:auth_tokens'}), (e:Endpoint {id:'endpoint:post_refresh'}) MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:auth_passwords'}), (e:Endpoint {id:'endpoint:post_password_change'}) MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:users'}), (e:Endpoint) WHERE e.id STARTS WITH 'endpoint:' AND e.path STARTS WITH '/api/v1/users' MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:authorization'}), (e:Endpoint) WHERE e.id IN ['endpoint:get_my_roles','endpoint:get_my_permissions'] MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:brain'}), (e:Endpoint) WHERE e.id STARTS WITH 'endpoint:' AND e.path STARTS WITH '/api/v1/brain' MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:redis_store'}), (e:Endpoint) WHERE e.id STARTS WITH 'endpoint:' AND e.path STARTS WITH '/api/v1/store' MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:vikunja'}), (e:Endpoint) WHERE e.id STARTS WITH 'endpoint:' AND e.path STARTS WITH '/api/v1/vikunja' MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:health'}), (e:Endpoint) WHERE e.id IN ['endpoint:get_health','endpoint:get_health_cleanup'] MERGE (r)-[:EXPOSES]->(e);
MATCH (r:Router {id:'router:oauth'}), (e:Endpoint) WHERE e.id STARTS WITH 'endpoint:' AND (e.path STARTS WITH '/api/v1/oauth' OR e.path STARTS WITH '/.well-known') MERGE (r)-[:EXPOSES]->(e);

// Modules → DB Models
MATCH (m:ServiceModule {id:'module:authentication'}), (d:DBModel) WHERE d.id IN ['model:access_token','model:refresh_token'] MERGE (m)-[:OWNS]->(d);
MATCH (m:ServiceModule {id:'module:authorization'}), (d:DBModel) WHERE d.id IN ['model:permission','model:user_permission','model:user_role','model:feature','model:action'] MERGE (m)-[:OWNS]->(d);
MATCH (m:ServiceModule {id:'module:users'}), (d:DBModel {id:'model:user'}) MERGE (m)-[:OWNS]->(d);
MATCH (m:ServiceModule {id:'module:oauth'}), (d:DBModel) WHERE d.id IN ['model:oauth_client','model:oauth_auth_code','model:oauth_access_token'] MERGE (m)-[:OWNS]->(d);

// Modules → External Services
MATCH (m:ServiceModule {id:'module:brain'}), (e:ExternalService {id:'ext:git'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:vikunja'}), (e:ExternalService {id:'ext:vikunja'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:redis_store'}), (r:RedisStore {id:'redis:main'}) MERGE (m)-[:READS_WRITES]->(r);
MATCH (m:ServiceModule {id:'module:mcp'}), (e:ExternalService {id:'ext:vikunja'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:mcp'}), (e:ExternalService {id:'ext:actual'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:mcp'}), (e:ExternalService {id:'ext:git'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:mcp'}), (e:ExternalService {id:'ext:hermes'}) MERGE (m)-[:CALLS]->(e);
MATCH (m:ServiceModule {id:'module:mcp'}), (r:RedisStore {id:'redis:main'}) MERGE (m)-[:READS_WRITES]->(r);

// MCP Server → Tools & Resources
MATCH (s:MCPServer {id:'mcp:server'}), (t:MCPTool) MERGE (s)-[:REGISTERS]->(t);
MATCH (s:MCPServer {id:'mcp:server'}), (r:MCPResource {id:'mcpresource:brain_notes'}) MERGE (s)-[:REGISTERS]->(r);
MATCH (s:MCPServer {id:'mcp:server'}), (o:OAuthFlow {id:'auth:oauth2'}) MERGE (s)-[:AUTHENTICATED_VIA]->(o);

// MCP Tools → Services/External
MATCH (t:MCPTool) WHERE t.group = 'brain' MATCH (m:ServiceModule {id:'module:brain'}) MERGE (t)-[:CALLS_SERVICE]->(m);
MATCH (t:MCPTool), (e:ExternalService {id:'ext:actual'}) WHERE t.group = 'budget' MERGE (t)-[:CALLS_SERVICE]->(e);
MATCH (t:MCPTool), (e:ExternalService {id:'ext:vikunja'}) WHERE t.group = 'tasks' MERGE (t)-[:CALLS_SERVICE]->(e);
MATCH (t:MCPTool), (m:ServiceModule {id:'module:redis_store'}) WHERE t.name IN ['save_cv_preset','get_cv_base_preset','preview_cv_preset'] MERGE (t)-[:CALLS_SERVICE]->(m);
MATCH (t:MCPTool), (e:ExternalService {id:'ext:hermes'}) WHERE t.group = 'hermes' MERGE (t)-[:CALLS_SERVICE]->(e);

// Permissions → Features + Actions
MATCH (p:Permission), (f:Feature) WHERE p.feature = f.name MERGE (p)-[:COMBINES]->(f);
MATCH (p:Permission), (a:Action) WHERE p.action = a.name MERGE (p)-[:COMBINES]->(a);

// Endpoints → Permissions (GUARDED_BY)
MATCH (e:Endpoint), (p:Permission {id:'perm:brain:read'}) WHERE e.id IN ['endpoint:get_brain_notes','endpoint:get_brain_note','endpoint:get_brain_search','endpoint:get_brain_folders'] MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:post_brain_note'}), (p:Permission {id:'perm:brain:create'}) MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:put_brain_note'}), (p:Permission {id:'perm:brain:update'}) MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:delete_brain_note'}), (p:Permission {id:'perm:brain:delete'}) MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint), (p:Permission {id:'perm:redis_store:read'}) WHERE e.id IN ['endpoint:get_store_prefixes','endpoint:get_store_categories','endpoint:get_store_keys','endpoint:get_store_value'] MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint), (p:Permission {id:'perm:redis_store:update'}) WHERE e.id IN ['endpoint:put_store_value','endpoint:patch_store_value'] MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:delete_store_value'}), (p:Permission {id:'perm:redis_store:delete'}) MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint), (p:Permission {id:'perm:vikunja:read'}) WHERE e.id IN ['endpoint:get_vikunja_projects','endpoint:get_vikunja_tasks'] MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:post_vikunja_task'}), (p:Permission {id:'perm:vikunja:create'}) MERGE (e)-[:GUARDED_BY]->(p);
MATCH (e:Endpoint {id:'endpoint:patch_vikunja_task'}), (p:Permission {id:'perm:vikunja:update'}) MERGE (e)-[:GUARDED_BY]->(p);

// Endpoints → Role guard (admin-only)
MATCH (e:Endpoint), (r:Role {id:'role:admin'}) WHERE e.adminOnly = true MERGE (e)-[:GUARDED_BY]->(r);

// Frontend Apps → Endpoints
MATCH (a:FrontendApp {id:'app:login'}), (e:Endpoint) WHERE e.id IN ['endpoint:post_login','endpoint:post_refresh','endpoint:post_password_change'] MERGE (a)-[:CALLS]->(e);
MATCH (a:FrontendApp {id:'app:cockpit'}), (e:Endpoint) WHERE e.id IN ['endpoint:get_me','endpoint:post_logout'] MERGE (a)-[:CALLS]->(e);
MATCH (a:FrontendApp {id:'app:cv'}), (e:Endpoint) WHERE e.id IN ['endpoint:get_store_value','endpoint:put_store_value','endpoint:get_store_prefixes'] MERGE (a)-[:CALLS]->(e);
MATCH (a:FrontendApp {id:'app:store'}), (e:Endpoint) WHERE e.path STARTS WITH '/api/v1/store' MERGE (a)-[:CALLS]->(e);

// Frontend Apps → Auth Flows
MATCH (a:FrontendApp), (f:AuthFlow {id:'auth:cookie_session'}) MERGE (a)-[:AUTHENTICATED_VIA]->(f);

// Frontend Apps → Pages
MATCH (a:FrontendApp {id:'app:login'}), (p:Page {id:'page:login'}) MERGE (a)-[:CONTAINS]->(p);
MATCH (a:FrontendApp {id:'app:cockpit'}), (p:Page {id:'page:cockpit_dashboard'}) MERGE (a)-[:CONTAINS]->(p);
MATCH (a:FrontendApp {id:'app:cv'}), (p:Page {id:'page:cv_editor'}) MERGE (a)-[:CONTAINS]->(p);
MATCH (a:FrontendApp {id:'app:store'}), (p:Page {id:'page:store_browser'}) MERGE (a)-[:CONTAINS]->(p);

// Pages → Permissions
MATCH (p:Page {id:'page:store_browser'}), (perm:Permission {id:'perm:redis_store:read'}) MERGE (p)-[:REQUIRES]->(perm);

// Frontend Apps → Nx Libs
MATCH (a:FrontendApp {id:'app:cockpit'}), (l:NxLib) WHERE l.id IN ['lib:shared_ui_react','lib:shared_data_access_react','lib:cockpit_ui','lib:shared_types_api_types'] MERGE (a)-[:USES]->(l);
MATCH (a:FrontendApp {id:'app:login'}), (l:NxLib) WHERE l.id IN ['lib:shared_ui_react','lib:shared_types_api_types','lib:shared_data_access_common'] MERGE (a)-[:USES]->(l);
MATCH (a:FrontendApp {id:'app:cv'}), (l:NxLib {id:'lib:shared_types_api_types'}) MERGE (a)-[:USES]->(l);
MATCH (a:FrontendApp {id:'app:store'}), (l:NxLib {id:'lib:shared_types_api_types'}) MERGE (a)-[:USES]->(l);

// ApiTypes ← generated from BackendAPI
MATCH (l:NxLib {id:'lib:shared_types_api_types'}), (a:BackendAPI {id:'api:main'}) MERGE (l)-[:GENERATED_FROM]->(a);

// App inter-connections
MATCH (a1:FrontendApp {id:'app:login'}), (a2:FrontendApp {id:'app:cockpit'}) MERGE (a1)-[:REDIRECTS_TO {condition:'on successful login'}]->(a2);
MATCH (a1:FrontendApp {id:'app:cockpit'}), (a2:FrontendApp {id:'app:cv'}) MERGE (a1)-[:LINKS_TO]->(a2);
MATCH (a1:FrontendApp {id:'app:cockpit'}), (a2:FrontendApp {id:'app:store'}) MERGE (a1)-[:LINKS_TO]->(a2);

// Deployment
MATCH (a:FrontendApp {id:'app:login'}), (c:Container {id:'container:login'}) MERGE (a)-[:DEPLOYED_AS]->(c);
MATCH (a:FrontendApp {id:'app:cockpit'}), (c:Container {id:'container:cockpit'}) MERGE (a)-[:DEPLOYED_AS]->(c);
MATCH (a:FrontendApp {id:'app:cv'}), (c:Container {id:'container:cv'}) MERGE (a)-[:DEPLOYED_AS]->(c);
MATCH (a:FrontendApp {id:'app:store'}), (c:Container {id:'container:store'}) MERGE (a)-[:DEPLOYED_AS]->(c);
MATCH (a:BackendAPI {id:'api:main'}), (c:Container {id:'container:api'}) MERGE (a)-[:DEPLOYED_AS]->(c);
MATCH (c:Container {id:'container:api'}), (ci:CIPipeline {id:'ci:api_deploy'}) MERGE (c)-[:BUILT_BY]->(ci);
MATCH (c:Container), (ci:CIPipeline {id:'ci:app_deploy'}) WHERE c.id IN ['container:login','container:cockpit','container:cv','container:store'] MERGE (c)-[:BUILT_BY]->(ci);
MATCH (ci:CIPipeline {id:'ci:api_deploy'}), (r:Registry {id:'registry:ghcr'}) MERGE (ci)-[:PUSHES_TO]->(r);
MATCH (ci:CIPipeline {id:'ci:app_deploy'}), (r:Registry {id:'registry:ghcr'}) MERGE (ci)-[:PUSHES_TO]->(r);
MATCH (ci1:CIPipeline {id:'ci:api_deploy'}), (ci2:CIPipeline {id:'ci:api_deploy_prod'}) MERGE (ci1)-[:TRIGGERS]->(ci2);
MATCH (ci1:CIPipeline {id:'ci:app_deploy'}), (ci2:CIPipeline {id:'ci:app_deploy_prod'}) MERGE (ci1)-[:TRIGGERS]->(ci2);
MATCH (ci:CIPipeline {id:'ci:api_deploy_prod'}), (t:DeployTarget {id:'target:pi'}) MERGE (ci)-[:DEPLOYS_TO]->(t);
MATCH (ci:CIPipeline {id:'ci:app_deploy_prod'}), (t:DeployTarget {id:'target:pi'}) MERGE (ci)-[:DEPLOYS_TO]->(t);
