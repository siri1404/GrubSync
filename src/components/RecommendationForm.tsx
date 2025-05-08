import React, { useState } from "react";
import { getRecommendations } from "../api/recommend";

const RecommendationForm = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formInput, setFormInput] = useState({
    cuisine_choices: "",
    dietary_restrictions: "",
    budget: 2,
    location: "",
    time: "19:00"
  });

  const handleSubmit = async () => {
    setLoading(true);
    const group = [
      {
        cuisine_choices: formInput.cuisine_choices.split(",").map(c => c.trim().toLowerCase()),
        dietary_restrictions: formInput.dietary_restrictions.split(",").map(d => d.trim().toLowerCase()),
        budget: formInput.budget,
        location: formInput.location,
        time: formInput.time
      }
    ];

    try {
      const recs = await getRecommendations(group);
      setResults(recs);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Cuisine choices (e.g., italian, kosher)"
          value={formInput.cuisine_choices}
          onChange={e => setFormInput({ ...formInput, cuisine_choices: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Dietary restrictions (optional)"
          value={formInput.dietary_restrictions}
          onChange={e => setFormInput({ ...formInput, dietary_restrictions: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          min="1"
          max="4"
          placeholder="Budget (1-4)"
          value={formInput.budget}
          onChange={e => setFormInput({ ...formInput, budget: Number(e.target.value) })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Location (e.g., Midtown, NYC)"
          value={formInput.location}
          onChange={e => setFormInput({ ...formInput, location: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="time"
          value={formInput.time}
          onChange={e => setFormInput({ ...formInput, time: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </div>

      <ul className="mt-6 space-y-4">
        {results.map((r, idx) => (
          <li key={idx} className="border p-4 rounded shadow">
            <div className="font-bold text-lg">{r.name}</div>
            <div>⭐ {r.rating} &nbsp;|&nbsp; {r.price || "N/A"} <br/>
            📍 {r.location.display_address.join(" • ")}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendationForm;