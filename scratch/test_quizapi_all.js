const API_KEY = "qa_sk_d7f4c9ce7ee8f5420b28f5eb16f7b9423dea9d2f";

async function test(label, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    console.log(`${res.ok ? "✅" : "❌"} ${label} [${res.status}]: ${text.slice(0, 150)}`);
    return res.ok;
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
    return false;
  }
}

async function run() {
  // Try all possible endpoint/auth combinations
  await test(
    "v1 (quizapi.io) — api_key query param",
    `https://quizapi.io/api/v1/questions?api_key=${API_KEY}&limit=1`
  );
  await test(
    "v1 (old.quizapi.io) — api_key query param",
    `https://old.quizapi.io/api/v1/questions?api_key=${API_KEY}&limit=1`
  );
  await test(
    "v1 (quizapi.io) — X-Api-Key header",
    `https://quizapi.io/api/v1/questions?limit=1`,
    { headers: { "X-Api-Key": API_KEY } }
  );
  await test(
    "v2 (quizapi.io) — Authorization Bearer",
    `https://quizapi.io/api/v2/questions?limit=1`,
    { headers: { "Authorization": `Bearer ${API_KEY}` } }
  );
  await test(
    "v2 (quizapi.io) — X-Api-Key header",
    `https://quizapi.io/api/v2/questions?limit=1`,
    { headers: { "X-Api-Key": API_KEY } }
  );
}

run();
