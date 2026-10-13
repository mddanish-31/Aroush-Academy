import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const pagePath = path.resolve('src/app/page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

console.log('Testing Homepage Roadmap Consistency...');

// Extract ROADMAP_ITEMS array from page.tsx
const match = content.match(/const ROADMAP_ITEMS = \[([\s\S]*?)\];/);
assert(match, 'ROADMAP_ITEMS array not found in page.tsx');

const itemsText = match[1];
const items = itemsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith('"'))
  .map(line => line.replace(/^"|",?$/g, ''));

console.log(`Found ${items.length} roadmap items.`);
assert.strictEqual(items.length, 28, 'Must have exactly 28 roadmap milestones');

// Check required implemented milestones from prompt
const hasOnlineClassroom = items.some(i => i.toLowerCase().includes('online classroom') && i.includes('Active'));
assert(hasOnlineClassroom, 'Missing active Online Classroom demo milestone');

const hasMockExam = items.some(i => i.toLowerCase().includes('mock examination') && i.includes('Active'));
assert(hasMockExam, 'Missing active Mock Examination Engine milestone');

const hasResultsCerts = items.some(i => i.toLowerCase().includes('academic results') && i.toLowerCase().includes('demo certificates') && i.includes('Active'));
assert(hasResultsCerts, 'Missing active Academic Results and Demo Certificates milestone');

const hasGradebook = items.some(i => i.toLowerCase().includes('gradebook') && i.includes('Active'));
assert(hasGradebook, 'Missing active Gradebook milestone');

// Ensure no false claims of unbuilt capabilities
for (const item of items) {
  if (item.includes('Active')) {
    assert(!item.toLowerCase().includes('proctored'), `Must not claim proctoring in active item: ${item}`);
    assert(!item.toLowerCase().includes('verifiable test & course'), `Must not claim official verifiable certificates in active item: ${item}`);
    assert(!item.toLowerCase().includes('classes engine'), `Must not claim classes engine in active item: ${item}`);
  }
}

// Ensure future items remain pending (inactive)
const pendingItems = items.filter(i => !i.includes('Active'));
console.log('Pending roadmap items count:', pendingItems.length);
assert.strictEqual(pendingItems.length, 3, 'Expected 3 pending items');
assert(pendingItems.includes('Recorded Courses & Sales Module'), 'Recorded Courses should be pending');
assert(pendingItems.includes('AI Doubt Resolution Engine'), 'AI Doubt Engine should be pending');
assert(pendingItems.includes('Android Application Shell (Capacitor/Native)'), 'Android Shell should be pending');

// Verify implemented components exist in the codebase
const componentChecks = [
  { name: 'ClassroomModule', path: 'src/components/dashboard/ClassroomModule.tsx' },
  { name: 'AssessmentsModule (Mock Exams & Gradebook)', path: 'src/components/dashboard/AssessmentsModule.tsx' },
  { name: 'ExamCertificateModal', path: 'src/components/dashboard/ExamCertificateModal.tsx' },
  { name: 'StudyMaterialsModule', path: 'src/components/dashboard/StudyMaterialsModule.tsx' },
  { name: 'DigitalIdCard', path: 'src/components/dashboard/DigitalIdCard.tsx' },
  { name: 'FeeReceiptModal', path: 'src/components/dashboard/FeeReceiptModal.tsx' },
  { name: 'DashboardShell', path: 'src/components/dashboard/DashboardShell.tsx' },
];

for (const comp of componentChecks) {
  assert(fs.existsSync(path.resolve(comp.path)), `Expected component ${comp.name} at ${comp.path} to exist`);
  console.log(`[PASS] Verified component backing: ${comp.name}`);
}

console.log('All 28 roadmap milestone verifications PASSED successfully!');
