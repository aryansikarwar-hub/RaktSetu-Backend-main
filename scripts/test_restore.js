/*
 Simple test script for template audit + restore flow.
 Requires Node 18+ for global fetch.
 Usage:
   node scripts/test_restore.js http://localhost:5000 <ADMIN_JWT>

 It will:
  - create a template
  - update it
  - list audits
  - restore the earlier version (full)
*/

const [,, base, token] = process.argv;
if (!base || !token) {
  console.error('Usage: node scripts/test_restore.js <baseUrl> <adminJwt>');
  process.exit(2);
}

const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

async function run() {
  try {
    console.log('Creating template...');
    let res = await fetch(`${base}/api/comm/templates`, { method: 'POST', headers, body: JSON.stringify({ name: 'Scripted Test', channel: 'email', subject: 'Hello {{name}}', body: 'Original body', default: false }) });
    const created = await res.json();
    console.log('Created:', created.template && created.template._id);

    console.log('Updating template...');
    res = await fetch(`${base}/api/comm/templates/${created.template._id}`, { method: 'PUT', headers, body: JSON.stringify({ subject: 'Updated subject', body: 'Updated body with {{units}}' }) });
    const upd = await res.json();
    console.log('Updated:', upd.template && upd.template._id);

    console.log('Listing audits...');
    res = await fetch(`${base}/api/comm/templates/audits?target=CommTemplate&targetId=${created.template._id}`, { headers });
    const aud = await res.json();
    console.log('Audits:', aud.total);
    if (!aud.audits || !aud.audits.length) { console.error('No audits found'); return; }
    const before = aud.audits[aud.audits.length - 1];
    console.log('Restoring first audit id', before._id);

    console.log('Restoring full snapshot...');
    res = await fetch(`${base}/api/comm/templates/${created.template._id}`, { method: 'PUT', headers, body: JSON.stringify(before.data) });
    const restored = await res.json();
    console.log('Restored:', restored.success);
  } catch (e) {
    console.error('Error', e);
  }
}

run();
