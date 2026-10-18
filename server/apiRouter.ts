import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { falkorClient } from './falkorClient.js';
import { graphRepository } from './graphRepository.js';
import { actionRepository } from './actionRepository.js';
import { verificationRepository } from './verificationRepository.js';
import { settingsRepository } from './settingsRepository.js';
import type { GraphFilterParams } from '../src/types/graph.js';

/**
 * Helper to send JSON responses
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Helper to read JSON request body
 */
async function readBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    const raw = (req as any).body;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    // Fallback if stream already ended
    if (req.readableEnded) {
      resolve({});
    }
  });
}

/**
 * Backend API request dispatcher
 * Mountable directly in Vite dev server (server.middlewares) or Express
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!req.url || !req.url.startsWith('/api')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  try {
    // 1. Health check & FalkorDB connection status
    if (pathname === '/api/health' && req.method === 'GET') {
      const status = await falkorClient.checkHealth();
      sendJson(res, 200, {
        status: status.connected ? 'healthy' : 'degraded',
        falkorConnected: status.connected,
        host: status.host,
        port: status.port,
        graphName: status.graphName,
        checkedAt: status.checkedAt,
        error: status.error || null,
        instructions: status.connected
          ? 'FalkorDB is connected and operational.'
          : 'To connect FalkorDB, run: docker run -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge'
      });
      return true;
    }

    // 2. Graph topology with filters
    if (pathname === '/api/graph' && req.method === 'GET') {
      const filter: GraphFilterParams = {
        workflowId: parsedUrl.searchParams.get('workflowId') || undefined,
        entityType: (parsedUrl.searchParams.get('entityType') as any) || 'ALL',
        status: (parsedUrl.searchParams.get('status') as any) || 'ALL',
        onlyBlockers: parsedUrl.searchParams.get('onlyBlockers') === 'true'
      };

      const result = await graphRepository.getGraphTopology(filter);
      sendJson(res, 200, result);
      return true;
    }

    // 3. Seed FalkorDB with onboarding dataset
    if (pathname === '/api/graph/seed' && req.method === 'POST') {
      const seedResult = await graphRepository.seedDatabase();
      sendJson(res, seedResult.success ? 200 : 503, seedResult);
      return true;
    }

    // 4. Parameterized Cypher query executor
    if (pathname === '/api/cypher' && req.method === 'POST') {
      const body = await readBody(req);
      const cypher = body.query;
      const params = body.params || {};

      if (!cypher || typeof cypher !== 'string') {
        sendJson(res, 400, {
          success: false,
          error: 'Missing required "query" string field in request body.'
        });
        return true;
      }

      const health = await falkorClient.checkHealth();
      if (!health.connected) {
        sendJson(res, 503, {
          success: false,
          error: `Cannot execute Cypher: FalkorDB is offline at ${health.host}:${health.port}.`,
          query: cypher
        });
        return true;
      }

      const queryResult = await falkorClient.executeQuery(cypher, params);
      sendJson(res, queryResult.success ? 200 : 500, queryResult);
      return true;
    }

    // 5. Actions: List with filters & stats
    if (pathname === '/api/actions' && req.method === 'GET') {
      const filters = {
        status: (parsedUrl.searchParams.get('status') as any) || 'ALL',
        urgency: (parsedUrl.searchParams.get('urgency') as any) || 'ALL',
        workflowId: parsedUrl.searchParams.get('workflowId') || 'ALL',
        searchQuery: parsedUrl.searchParams.get('search') || undefined
      };
      const items = actionRepository.getActions(filters);
      const allItems = actionRepository.getActions();
      const stats = {
        total: allItems.length,
        pendingReview: allItems.filter(a => a.status === 'PENDING_REVIEW').length,
        readyForExecution: allItems.filter(a => a.status === 'READY_FOR_EXECUTION').length,
        awaitingVerification: allItems.filter(a => a.status === 'AWAITING_VERIFICATION').length,
        completed: allItems.filter(a => a.status === 'COMPLETED').length
      };
      sendJson(res, 200, { actions: items, stats });
      return true;
    }

    // 6. Actions: Reset to initial state
    if (pathname === '/api/actions/reset' && req.method === 'POST') {
      actionRepository.resetToInitialState();
      sendJson(res, 200, { success: true, message: 'Action repository reset to initial state.' });
      return true;
    }

    // 7. Actions: Review decision (Approve / Reject / Request Info / Cancel)
    const reviewMatch = pathname.match(/^\/api\/actions\/([a-zA-Z0-9_-]+)\/review$/);
    if (reviewMatch && req.method === 'POST') {
      const actionId = reviewMatch[1];
      const body = await readBody(req);

      // Backend authorization: EMPLOYEE cannot approve or reject actions
      const actorRole = body.actor?.role || (req.headers['x-user-role'] as string);
      if (actorRole === 'EMPLOYEE') {
        sendJson(res, 403, {
          success: false,
          error: "Forbidden: Role 'EMPLOYEE' lacks authorization to approve or reject actions. Manager or Admin/Operations role required."
        });
        return true;
      }

      if (!body.actor) {
        body.actor = {
          id: 'usr-default',
          name: actorRole === 'ADMIN_OPERATIONS' ? 'Sarah Lin' : 'Authorized Reviewer',
          role: actorRole || 'ADMIN_OPERATIONS',
          email: 'reviewer@closureloop.io'
        };
      }

      const result = actionRepository.transitionAction(actionId, body);
      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    // 8. Actions: Execute action
    const execMatch = pathname.match(/^\/api\/actions\/([a-zA-Z0-9_-]+)\/execute$/);
    if (execMatch && req.method === 'POST') {
      const actionId = execMatch[1];
      const body = await readBody(req);
      const actorRole = body.actor?.role || (req.headers['x-user-role'] as string);

      // Backend authorization: EMPLOYEE cannot execute system actions
      if (actorRole === 'EMPLOYEE') {
        sendJson(res, 403, {
          success: false,
          error: "Forbidden: Role 'EMPLOYEE' lacks operational authorization to execute system actions."
        });
        return true;
      }

      const actor = body.actor || {
        id: 'usr-default',
        name: 'Authorized Operator',
        role: 'ADMIN_OPERATIONS',
        email: 'operator@closureloop.io'
      };

      const result = actionRepository.executeAction(actionId, actor);
      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    // 9. Actions: Single action by ID
    const actionMatch = pathname.match(/^\/api\/actions\/([a-zA-Z0-9_-]+)$/);
    if (actionMatch && req.method === 'GET') {
      const actionId = actionMatch[1];
      const action = actionRepository.getActionById(actionId);
      if (!action) {
        sendJson(res, 404, { error: `Action '${actionId}' not found.` });
        return true;
      }
      sendJson(res, 200, { action });
      return true;
    }

    // 10. Verification: List records with filters & telemetry stats
    if (pathname === '/api/verifications' && req.method === 'GET') {
      const filters = {
        status: parsedUrl.searchParams.get('status') || 'ALL',
        department: parsedUrl.searchParams.get('department') || 'ALL',
        searchQuery: parsedUrl.searchParams.get('search') || undefined
      };
      const verifications = verificationRepository.getVerifications(filters);
      const stats = verificationRepository.getStats();
      sendJson(res, 200, { verifications, stats });
      return true;
    }

    // 11. Verification: Reset verification & memory state
    if (pathname === '/api/verifications/reset' && req.method === 'POST') {
      verificationRepository.resetToInitialState();
      sendJson(res, 200, { success: true, message: 'Verification & Memory repository reset to baseline.' });
      return true;
    }

    // 12. Verification: Run verification check on workflow
    const runMatch = pathname.match(/^\/api\/verifications\/([a-zA-Z0-9_-]+)\/run$/);
    if (runMatch && req.method === 'POST') {
      const workflowId = runMatch[1];
      const body = await readBody(req);
      const scenario = body.scenario || 'DEFAULT';
      const actor = body.actor || {
        id: 'usr-verifier',
        name: 'ClosureLoop Verification Engine v2.4',
        role: 'Automated Cryptographic Verifier'
      };
      const result = await verificationRepository.executeVerificationRun(workflowId, scenario, actor);
      sendJson(res, 200, result);
      return true;
    }

    // 13. Verification: Single workflow verification details & events
    const verifMatch = pathname.match(/^\/api\/verifications\/([a-zA-Z0-9_-]+)$/);
    if (verifMatch && req.method === 'GET') {
      const workflowId = verifMatch[1];
      const verification = verificationRepository.getVerificationByWorkflowId(workflowId);
      if (!verification) {
        sendJson(res, 404, { error: `Verification record for workflow '${workflowId}' not found.` });
        return true;
      }
      const events = verificationRepository.getEventsByWorkflowId(workflowId);
      sendJson(res, 200, { verification, events });
      return true;
    }

    // 14. Memory: List historical memory records
    if (pathname === '/api/memory' && req.method === 'GET') {
      const search = parsedUrl.searchParams.get('search') || undefined;
      const memories = verificationRepository.getMemories(search);
      sendJson(res, 200, { memories, total: memories.length });
      return true;
    }

    // 15. Memory: Single historical record by ID
    const memMatch = pathname.match(/^\/api\/memory\/([a-zA-Z0-9_-]+)$/);
    if (memMatch && req.method === 'GET') {
      const memoryId = memMatch[1];
      const memory = verificationRepository.getMemoryById(memoryId);
      if (!memory) {
        sendJson(res, 404, { error: `Memory record '${memoryId}' not found.` });
        return true;
      }
      sendJson(res, 200, { memory });
      return true;
    }

    // 16. Settings: Full system settings and integration registry
    if (pathname === '/api/settings' && req.method === 'GET') {
      const payload = await settingsRepository.getSettingsPayload();
      sendJson(res, 200, payload);
      return true;
    }

    // 17. Settings: Test live FalkorDB connection
    if (pathname === '/api/settings/test-falkor' && req.method === 'POST') {
      const result = await settingsRepository.testFalkorConnection();
      sendJson(res, 200, result);
      return true;
    }

    // 18. Settings: Master demo state reset across all modules
    if (pathname === '/api/settings/reset-all' && req.method === 'POST') {
      const result = settingsRepository.resetAllRepositories();
      sendJson(res, 200, result);
      return true;
    }

    // 404 for unhandled /api routes
    sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });
    return true;
  } catch (err: any) {
    sendJson(res, 500, {
      error: 'Internal server error while processing API request',
      message: err.message || String(err)
    });
    return true;
  }
}
