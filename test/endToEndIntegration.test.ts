import assert from 'node:assert';
import { falkorClient } from '../server/falkorClient.js';
import { graphRepository } from '../server/graphRepository.js';
import { actionRepository } from '../server/actionRepository.js';
import { verificationRepository } from '../server/verificationRepository.js';
import { settingsRepository } from '../server/settingsRepository.js';

console.log('================================================================');
console.log('CLOSURELOOP — APPLICATION-WIDE END-TO-END INTEGRATION TEST');
console.log('================================================================');

async function runEndToEndTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✓ ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ✗ ${name}`);
        console.error(`    Error: ${err.message || err}`);
        failed++;
      });
  }

  // 1. Initial State Reset
  settingsRepository.resetAllRepositories();

  console.log('\nTesting Module 1–7 Subsystem Integration:\n');

  // Test 1: FalkorDB Backend Client & Health Handling
  await test('MODULE 1 & 4 — FalkorDB Connection & Graph Topology Handling', async () => {
    const health = await falkorClient.checkHealth();
    assert.strictEqual(typeof health.connected, 'boolean');
    assert.strictEqual(health.host, '127.0.0.1');
    assert.strictEqual(health.port, 6379);

    // Retrieve Graph Topology (Live or Structured Fallback)
    const topology = await graphRepository.getGraphTopology();
    assert.ok(topology.graph.nodes.length >= 8, 'Graph must contain at least 8 entity nodes');
    assert.ok(topology.graph.edges.length >= 7, 'Graph must contain relational edges');
    assert.ok(topology.graph.nodes.some(n => n.id === 'wf-001'), 'Must include Jordan Hayes workflow node');
    assert.ok(topology.graph.nodes.some(n => n.id === 'sec-tkt-9912'), 'Must include Sarah Lin approval bottleneck');
  });

  // Test 2: Cypher Query Executor Validation
  await test('MODULE 4 — Parameterized Cypher Query Execution & Graceful Fallback', async () => {
    const cypherResult = await falkorClient.executeQuery('MATCH (w:Workflow) RETURN w');
    assert.ok(cypherResult, 'Query response envelope must exist');
    assert.strictEqual(typeof cypherResult.executionTimeMs, 'number');
    assert.strictEqual(typeof cypherResult.success, 'boolean');
  });

  // Test 3: Action Center Lifecycle & State Machine Enforcement
  await test('MODULE 5 — Action State Machine: Review -> Approval -> Execution -> Awaiting Verification', async () => {
    const action = actionRepository.getActionById('ACT-2026-0901');
    assert.ok(action, 'Action ACT-2026-0901 must exist');
    assert.strictEqual(action?.status, 'PENDING_REVIEW');

    // 1. Review & Approve
    const reviewRes = actionRepository.transitionAction('ACT-2026-0901', {
      decision: 'APPROVE',
      actor: {
        id: 'usr-104',
        name: 'David Chen',
        role: 'Engineering Director',
        email: 'david.chen@closureloop.io'
      },
      notes: 'Approved expedited escalation to Sarah Lin.'
    });
    assert.strictEqual(reviewRes.success, true);
    assert.strictEqual(actionRepository.getActionById('ACT-2026-0901')?.status, 'READY_FOR_EXECUTION');

    // 2. Dispatch Action
    const execRes = actionRepository.executeAction('ACT-2026-0901', {
      id: 'usr-104',
      name: 'David Chen',
      role: 'Engineering Director',
      email: 'david.chen@closureloop.io'
    });
    assert.strictEqual(execRes.success, true);
    assert.strictEqual(actionRepository.getActionById('ACT-2026-0901')?.status, 'AWAITING_VERIFICATION');

    // 3. Idempotency Protection: Re-executing suppressed
    const dupRes = actionRepository.executeAction('ACT-2026-0901', {
      id: 'usr-104',
      name: 'David Chen',
      role: 'Engineering Director',
      email: 'david.chen@closureloop.io'
    });
    assert.strictEqual(dupRes.success, false);
    assert.ok(dupRes.message.includes('already been executed'));
  });

  // Test 4: Verification Engine: Anti-Fabrication & Cryptographic Evidence
  await test('MODULE 6 — Autonomous Outcome Verification & Long-Term Memory Archiving', async () => {
    // Stage A: Before Commit (Case 2 - Approval without Access/Outcome)
    const pendingVerif = await verificationRepository.executeVerificationRun('wf-001', 'APPROVAL_WITHOUT_ACCESS');
    assert.strictEqual(pendingVerif.newStatus, 'INCOMPLETE', 'Action dispatch alone must NOT mark onboarding complete');

    // Stage B: Verified Complete (Case 1 - All criteria met with commit sha)
    const completeVerif = await verificationRepository.executeVerificationRun('wf-001', 'ALL_PASSED');
    assert.strictEqual(completeVerif.newStatus, 'VERIFIED_COMPLETE');
    assert.strictEqual(completeVerif.verificationRecord.completionPercentage, 100);
    assert.ok(completeVerif.memoryArchived, 'Resolution must be archived to long-term memory');

    // Verify Action was promoted to COMPLETED
    const action = actionRepository.getActionById('ACT-2026-0901');
    assert.strictEqual(action?.status, 'COMPLETED');
    assert.strictEqual(action?.verificationRequirement.verificationStatus, 'VERIFIED');

    // Verify Memory Record exists in index
    const memories = verificationRepository.getMemories('Jordan Hayes');
    assert.ok(memories.length > 0);
    assert.strictEqual(memories[0].outcomeVerified, true);
  });

  // Test 5: Settings & Diagnostics Integration
  await test('MODULE 7 — Settings Payload, Connector Registry & Diagnostics Verification', async () => {
    const settings = await settingsRepository.getSettingsPayload();
    assert.strictEqual(settings.general.demoMode, true);
    assert.strictEqual(settings.general.strictServiceBoundary, true);
    assert.ok(settings.integrations.length >= 8, 'Must catalog all 8 enterprise connectors');
    
    // Check connector statuses
    const falkorInt = settings.integrations.find(i => i.id === 'int-falkor');
    assert.strictEqual(falkorInt?.adapterType, 'LIVE_DRIVER');

    const slackInt = settings.integrations.find(i => i.id === 'int-slack');
    assert.strictEqual(slackInt?.adapterType, 'DEMO_ADAPTER');

    // Diagnostics Telemetry
    assert.ok(settings.diagnostics.activeWorkflows >= 4);
    assert.ok(settings.diagnostics.activeActions >= 4);
    assert.ok(settings.diagnostics.verifiedOutcomes >= 1);
  });

  // Test 6: Master Reset Capability
  await test('MODULE 7 — Master System Baseline Reset', async () => {
    const resetRes = settingsRepository.resetAllRepositories();
    assert.strictEqual(resetRes.success, true);

    const action = actionRepository.getActionById('ACT-2026-0901');
    assert.strictEqual(action?.status, 'PENDING_REVIEW');

    const verif = verificationRepository.getVerificationByWorkflowId('wf-001');
    assert.strictEqual(verif?.overallStatus, 'INCOMPLETE');
  });

  // Test 7: Role-Based Authorization & Graph Scoping for Employee
  await test('MODULE 1 & 4 — Role-Based Authorization & Least-Privilege Scoping for Employee', async () => {
    // 1. Employee Role Query: Scoped to Personal Subgraph
    const employeeTopology = await graphRepository.getGraphTopology({ userRole: 'EMPLOYEE' });
    const employeeNodeIds = employeeTopology.graph.nodes.map(n => n.id);

    // Administrative internal nodes must be redacted
    assert.strictEqual(employeeNodeIds.includes('usr-008'), false, 'Sarah Lin SecOps node must be hidden from employee');
    assert.strictEqual(employeeNodeIds.includes('tsk-003'), false, 'Manager Day-1 checklist task must be hidden from employee');
    assert.strictEqual(employeeNodeIds.includes('app-core-svc'), false, 'Production cluster node must be hidden from employee');

    // Personal nodes must be preserved
    assert.strictEqual(employeeNodeIds.includes('emp-90214'), true, 'Rahul Sharma employee node must be present');
    assert.strictEqual(employeeNodeIds.includes('wf-001'), true, 'Onboarding workflow node must be present');
    assert.strictEqual(employeeNodeIds.includes('sec-tkt-9912'), true, 'Security approval node must be present');

    // Approval node must be sanitized
    const securityNode = employeeTopology.graph.nodes.find(n => n.id === 'sec-tkt-9912');
    assert.ok(securityNode?.data.blockerReason?.includes('Turnaround SLA'), 'Security approval reason must be sanitized for employee');

    // 2. Admin / Full Query: Returns complete enterprise topology
    const adminTopology = await graphRepository.getGraphTopology({ userRole: 'ADMIN_OPERATIONS' });
    const adminNodeIds = adminTopology.graph.nodes.map(n => n.id);
    assert.strictEqual(adminNodeIds.includes('usr-008'), true, 'Admin must see Sarah Lin node');
    assert.strictEqual(adminNodeIds.includes('tsk-003'), true, 'Admin must see manager checklist task');
    assert.strictEqual(adminNodeIds.includes('app-core-svc'), true, 'Admin must see production cluster node');
  });

  console.log('\n================================================================');
  console.log(`END-TO-END RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndTests();
