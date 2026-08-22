const API_KEY = "qa_sk_d7f4c9ce7ee8f5420b28f5eb16f7b9423dea9d2f";
const tag = "Python";

async function run() {
  const url = `https://quizapi.io/api/v1/questions?api_key=${API_KEY}&tags=${encodeURIComponent(tag)}&limit=3&multiple_correct_answers=false`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  console.log("✅ Status:", res.status, res.ok ? "OK" : "FAILED");
  console.log("✅ Questions returned:", data.data?.length ?? 0);
  for (const q of data.data ?? []) {
    const correct = q.answers?.find(a => a.isCorrect)?.text;
    console.log(`  Q: ${q.text?.slice(0, 70)}`);
    console.log(`  Concept (tags[0]): ${q.tags?.[0] ?? q.category}`);
    console.log(`  Correct: ${correct}`);
    console.log("---");
  }
}

run();

