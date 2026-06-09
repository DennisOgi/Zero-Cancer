const BASE = 'https://zerocancer.daunderlord.workers.dev/api/v1';
const PASS = 'ZeroCancer2026!';

async function login(email, actor) {
  const res = await fetch(`${BASE}/auth/login?actor=${actor}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${actor} login: ${JSON.stringify(json)}`);
  return json.data.token;
}

async function main() {
  // Donor campaigns (currently broken on prod)
  try {
    const donorToken = await login('test.donor@zerocancer.org', 'donor');
    const campaigns = await fetch(`${BASE}/donor/campaigns`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const body = await campaigns.text();
    console.log('DONOR_CAMPAIGNS', campaigns.status, body.slice(0, 300));
  } catch (e) {
    console.log('DONOR_CAMPAIGNS_ERR', e.message);
  }

  // Center payouts
  try {
    const centerToken = await login('lagos.test.center@zerocancer.org', 'center');
    const me = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${centerToken}` },
    }).then((r) => r.json());
    const centerId = me.data.user.id;

    const payout = await fetch(`${BASE}/payouts/center/${centerId}/balance`, {
      headers: { Authorization: `Bearer ${centerToken}` },
    });
    const payoutBody = await payout.text();
    console.log('CENTER_PAYOUT', payout.status, payoutBody.slice(0, 300));

    const pub = await fetch(`${BASE}/center/${centerId}`).then((r) => r.json());
    console.log('PUBLIC_CENTER_STAFF_COUNT', pub.data?.staff?.length ?? 'n/a');
  } catch (e) {
    console.log('CENTER_ERR', e.message);
  }

  // Patient gender
  try {
    const patientToken = await login('test.patient.lagos@zerocancer.org', 'patient');
    const me = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    }).then((r) => r.json());
    console.log('PATIENT_GENDER', me.data?.user?.patientProfile?.gender ?? 'missing');
  } catch (e) {
    console.log('PATIENT_ERR', e.message);
  }
}

main();
