const API_KEY = "qa_sk_d7f4c9ce7ee8f5420b28f5eb16f7b9423dea9d2f";

async function run() {
  const url = `https://quizapi.io/api/v1/questions?api_key=${API_KEY}&limit=2&multiple_correct_answers=false`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Full response structure:");
  console.log(JSON.stringify(data, null, 2));
}

run();
