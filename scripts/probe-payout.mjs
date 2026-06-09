const BASE = 'https://zerocancer.daunderlord.workers.dev/api/v1';

async function login(email, actor) {
  const res = await fetch(`${BASE}/auth/login?actor=${actor}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'ZeroCancer2026!' }),
  });
  const json = await res.json();
  return json.data.token;
}

async function main() {
  const centerToken = await login('lagos.test.center@zerocancer.org', 'center');
  const me = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${centerToken}` },
  }).then((r) => r.json());
  const centerId = me.data.user.id;
  console.log('centerId', centerId, 'profile', me.data.user.profile);

  const payout = await fetch(`${BASE}/payouts/center/${centerId}/balance`, {
    headers: { Authorization: `Bearer ${centerToken}` },
  });
  console.log('status', payout.status);
  console.log(await payout.text());
}

main().catch((e) => console.error(e));
