// src/api/recommend.ts

export async function getRecommendations(group: any[]) {
  const res = await fetch("http://localhost:5000/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group,
      top_k: 5
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || "Failed to fetch recommendations");
  }

  return await res.json();
}
