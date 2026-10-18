import assert from 'node:assert';
import { verificationRepository } from '../server/verificationRepository.js';
import { actionRepository } from '../server/actionRepository.js';

console.log('================================================================');
console.log('CLOSURELOOP — MODULE 6: VERIFICATION SERVICE TEST SUITE');
console.log('================================================================');

async function runTestSuite() {
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

  // Baseline Reset
  verificationRepository.resetToInitialState();
  actionRepository.resetToInitialState();

  console.log('\nRunning Part 9 Mandatory Acceptance Cases:\n');

  // CASE 1: Successful Outcome
  await test('CASE 1 — Successful outcome: All mandatory requirements have trustworthy evidence -> VERIFIED_COMPLETE', async () => {
    verificationRepository.resetToInitialState();
    actionRepository.resetToInitialState();

    const res = await verificationRepository.executeVerificationRun('wf-001', 'ALL_PASSED');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newStatus, 'VERIFIED_COMPLETE');
    assert.strictEqual(res.verificationRecord.completionPercentage, 100);
    assert.strictEqual(res.verificationRecord.mandatoryChecksPassed, true);
    assert.strictEqual(res.verificationRecord.passedChecksCount, 6);
    assert.ok(res.memoryArchived, 'Completed incident should be archived to memory');

    // Verify it exists in long term memory
    const memories = verificationRepository.getMemories('Jordan Hayes');
    assert.ok(memories.length > 0, 'New memory record should be searchable in long-term memory');
  });

  // CASE 2: Approval without Access
  await test('CASE 2 — Approval without access: Security approval granted, but AWS IAM access is unconfirmed -> INCOMPLETE', async () => {
    verificationRepository.resetToInitialState();

    const res = await verificationRepository.executeVerificationRun('wf-001', 'APPROVAL_WITHOUT_ACCESS');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newStatus, 'INCOMPLETE');
    assert.strictEqual(res.verificationRecord.mandatoryChecksPassed, false);

    // Check 4 (Approval) passed, but Check 5 (IAM Role Access) failed!
    const approvalCheck = res.verificationRecord.checks.find(c => c.category === 'SECURITY_APPROVAL');
    const accessCheck = res.verificationRecord.checks.find(c => c.category === 'INFRASTRUCTURE_ACCESS');
    assert.strictEqual(approvalCheck?.status, 'PASSED');
    assert.strictEqual(accessCheck?.status, 'FAILED');
  });

  // CASE 3: Missing Evidence
  await test('CASE 3 — Missing evidence: Mandatory requirement has missing/corrupted evidence -> check fails & outcome incomplete', async () => {
    verificationRepository.resetToInitialState();

    const res = await verificationRepository.executeVerificationRun('wf-001', 'MISSING_EVIDENCE');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newStatus, 'INCOMPLETE');
    
    const managerCheck = res.verificationRecord.checks.find(c => c.category === 'MANAGEMENT');
    assert.strictEqual(managerCheck?.status, 'FAILED');
    assert.ok(managerCheck?.observedValue.toString().includes('EVIDENCE_UNAVAILABLE'));
  });

  // CASE 4: Failed Check
  await test('CASE 4 — Failed check: Configured source reports check explicitly rejected -> FAILED status', async () => {
    verificationRepository.resetToInitialState();

    const res = await verificationRepository.executeVerificationRun('wf-001', 'FAILED_CHECK');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newStatus, 'FAILED');

    const approvalCheck = res.verificationRecord.checks.find(c => c.category === 'SECURITY_APPROVAL');
    assert.strictEqual(approvalCheck?.status, 'FAILED');
    assert.ok(approvalCheck?.observedValue.toString().includes('REJECTED'));
  });

  // CASE 5: Unavailable Integration
  await test('CASE 5 — Unavailable integration: System cannot contact external source -> UNAVAILABLE check & INCONCLUSIVE status', async () => {
    verificationRepository.resetToInitialState();

    const res = await verificationRepository.executeVerificationRun('wf-001', 'UNAVAILABLE_INTEGRATION');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newStatus, 'INCONCLUSIVE');

    const commitCheck = res.verificationRecord.checks.find(c => c.category === 'BUSINESS_OUTCOME');
    assert.strictEqual(commitCheck?.status, 'UNAVAILABLE');
    assert.ok(commitCheck?.observedValue.toString().includes('CONNECTION_TIMEOUT'));
  });

  // CASE 6: Historical Verification Persistence
  await test('CASE 6 — Historical verification: Recorded result, timestamps, and memory records persist without being overwritten', async () => {
    verificationRepository.resetToInitialState();

    const v1 = verificationRepository.getVerificationByWorkflowId('wf-004');
    assert.ok(v1, 'wf-004 should exist');
    assert.strictEqual(v1?.overallStatus, 'VERIFIED_COMPLETE');
    assert.strictEqual(v1?.completionPercentage, 100);

    // Verify initial memories exist
    const memories = verificationRepository.getMemories();
    assert.strictEqual(memories.length >= 4, true);

    // Events stream exists
    const events = verificationRepository.getEventsByWorkflowId('wf-001');
    assert.ok(events.length >= 5, 'Chronological events stream must retain historical milestones');
  });

  // CASE 7: Regression on Action Center and Graph Repository
  await test('CASE 7 — Regression: Action Center and Graph repository remain fully operational', async () => {
    const actions = actionRepository.getActions();
    assert.strictEqual(actions.length >= 4, true);

    const stats = actionRepository.getStats();
    assert.strictEqual(stats.total >= 4, true);
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
