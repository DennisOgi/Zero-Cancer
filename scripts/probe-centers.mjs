const BASE = 'https://zerocancer.daunderlord.workers.dev/api/v1';

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: r.status, json };
}

async function main() {
  const tests = [];

  const all = await get('/center?page=1&pageSize=8&status=ACTIVE');
  tests.push({
    name: 'featured_centers_active',
    status: all.status,
    ok: all.json.ok,
    count: all.json.data?.centers?.length ?? 0,
    sample: all.json.data?.centers?.[0]
      ? {
          id: all.json.data.centers[0].id,
          name: all.json.data.centers[0].centerName,
          state: all.json.data.centers[0].state,
          lga: all.json.data.centers[0].lga,
          services: all.json.data.centers[0].services?.length ?? 0,
        }
      : null,
    error: all.json.error,
  });

  const lagos = await get('/center?state=Lagos&pageSize=50');
  tests.push({
    name: 'filter_state_lagos',
    status: lagos.status,
    ok: lagos.json.ok,
    count: lagos.json.data?.centers?.length ?? 0,
    error: lagos.json.error,
  });

  const lagosScreening = await get(
    '/center?state=Lagos&serviceType=screening&pageSize=50',
  );
  tests.push({
    name: 'filter_lagos_screening',
    status: lagosScreening.status,
    ok: lagosScreening.json.ok,
    count: lagosScreening.json.data?.centers?.length ?? 0,
    error: lagosScreening.json.error,
  });

  const centerId = all.json.data?.centers?.[0]?.id;
  if (centerId) {
    const detail = await get(`/center/${centerId}`);
    tests.push({
      name: 'center_detail_public',
      status: detail.status,
      ok: detail.json.ok,
      staffCount: detail.json.data?.staff?.length ?? -1,
      services: detail.json.data?.services?.length ?? 0,
      error: detail.json.error,
    });
  }

  // Patient book flow: login + book endpoint smoke
  const loginRes = await fetch(`${BASE}/auth/login?actor=patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test.patient.lagos@zerocancer.org',
      password: 'ZeroCancer2026!',
    }),
  });
  const login = await loginRes.json();
  if (login.ok && centerId) {
    const center = all.json.data.centers[0];
    const screeningTypeId = center.services?.[0]?.id;
    if (screeningTypeId) {
      const bookRes = await fetch(`${BASE}/appointment/patient/book`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${login.data.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screeningTypeId,
          centerId,
          paymentReference: `PROBE-${Date.now()}`,
          appointmentDateTime: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      });
      const bookText = await bookRes.text();
      let bookJson;
      try {
        bookJson = JSON.parse(bookText);
      } catch {
        bookJson = { raw: bookText.slice(0, 300) };
      }
      tests.push({
        name: 'patient_book_smoke',
        status: bookRes.status,
        ok: bookJson.ok,
        hasPaymentUrl: !!bookJson.data?.payment?.authorizationUrl,
        error: bookJson.error || bookJson.raw,
      });
    }
  }

  console.log(JSON.stringify({ timestamp: new Date().toISOString(), tests }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
