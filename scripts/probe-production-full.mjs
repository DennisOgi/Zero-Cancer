const BASE = 'https://zerocancer.daunderlord.workers.dev/api/v1';
const PASS = 'ZeroCancer2026!';

async function login(email, actor) {
  const res = await fetch(`${BASE}/auth/login?actor=${actor}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${actor} login failed: ${JSON.stringify(json)}`);
  return json.data.token;
}

async function probe(name, fn) {
  try {
    const result = await fn();
    return { name, ok: true, ...result };
  } catch (e) {
    return { name, ok: false, error: e.message };
  }
}

async function main() {
  const results = [];

  results.push(
    await probe('health', async () => {
      const r = await fetch(`${BASE}/healthz`);
      const j = await r.json();
      return { status: r.status, body: j };
    }),
  );

  const patientToken = await login('test.patient.lagos@zerocancer.org', 'patient');
  results.push(
    await probe('patient_auth_me', async () => {
      const r = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const j = await r.json();
      return {
        status: r.status,
        gender: j.data?.user?.gender,
        phone: j.data?.user?.phone,
        state: j.data?.user?.state,
        hasProfileFields: !!(j.data?.user?.phone !== undefined),
      };
    }),
  );

  results.push(
    await probe('patient_appointments', async () => {
      const r = await fetch(`${BASE}/appointment/patient?page=1&size=5`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const j = await r.json();
      const scheduled = (j.data?.appointments || []).filter((a) => a.status === 'SCHEDULED');
      return {
        status: r.status,
        total: j.data?.appointments?.length ?? 0,
        scheduledCount: scheduled.length,
        firstScheduledId: scheduled[0]?.id ?? null,
      };
    }),
  );

  results.push(
    await probe('patient_cancel_route', async () => {
      const r = await fetch(`${BASE}/appointment/patient/00000000-0000-0000-0000-000000000099/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${patientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'probe' }),
      });
      const j = await r.json();
      return {
        status: r.status,
        error: j.error,
        routeExists: r.status !== 404,
      };
    }),
  );

  results.push(
    await probe('patient_profile_patch_route', async () => {
      const r = await fetch(`${BASE}/auth/patient-profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${patientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const j = await r.json();
      return {
        status: r.status,
        routeExists: r.status !== 404,
        validationError: j.error ?? null,
      };
    }),
  );

  const donorToken = await login('test.donor@zerocancer.org', 'donor');
  results.push(
    await probe('donor_campaigns', async () => {
      const r = await fetch(`${BASE}/donor/campaigns`, {
        headers: { Authorization: `Bearer ${donorToken}` },
      });
      const j = await r.json();
      return {
        status: r.status,
        total: j.data?.total ?? 0,
        campaigns: j.data?.campaigns?.length ?? 0,
      };
    }),
  );

  results.push(
    await probe('donor_campaign_update_route', async () => {
      const r = await fetch(`${BASE}/donor/campaigns/00000000-0000-0000-0000-000000000099`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${donorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: '00000000-0000-0000-0000-000000000099',
          title: 'Probe',
          description: 'Probe description long enough',
        }),
      });
      const j = await r.json();
      return {
        status: r.status,
        routeExists: r.status !== 404,
        error: j.error ?? null,
      };
    }),
  );

  const centerToken = await login('lagos.test.center@zerocancer.org', 'center');
  const me = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${centerToken}` },
  }).then((r) => r.json());
  const centerId = me.data.user.id;

  results.push(
    await probe('center_public_no_staff_leak', async () => {
      const r = await fetch(`${BASE}/center/${centerId}`);
      const j = await r.json();
      return {
        status: r.status,
        staffCount: j.data?.staff?.length ?? -1,
      };
    }),
  );

  results.push(
    await probe('center_screening_reports_auth', async () => {
      const r = await fetch(`${BASE}/screening-reports`, {
        headers: { Authorization: `Bearer ${centerToken}` },
      });
      return { status: r.status, routeExists: r.status !== 404 };
    }),
  );

  console.log(JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
}

main().catch((e) => {
  console.error('PROBE_FATAL', e.message);
  process.exit(1);
});
