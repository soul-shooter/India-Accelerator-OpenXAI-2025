// app/page.tsx
"use client";
import { useState } from "react";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<string>("");

  async function generate() {
    setLoading(true);
    setQuiz(null);
    setRaw("");

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.quiz)) {
        setQuiz(data.quiz);
      } else {
        // show raw output (debug) so we can fix prompt
        setRaw(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setRaw(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", color: "#ddd", fontFamily: "system-ui, Arial" }}>
      <h1>🎯 Quiz Generator</h1>

      <div style={{ marginTop: 12 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., Blockchain basics)"
          style={{ padding: 8, width: "60%", marginRight: 8 }}
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: 8 }}>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <button onClick={generate} style={{ marginLeft: 8, padding: "8px 12px" }}>Generate</button>
      </div>

      {loading && <p style={{ marginTop: 16 }}>⏳ Generating — please wait...</p>}

      {quiz && (
        <div style={{ marginTop: 16 }}>
          {quiz.map((q, i) => (
            <div key={i} style={{ border: "1px solid #444", padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{i + 1}. {q.question}</div>
              <ul style={{ marginTop: 8 }}>
                {q.options && q.options.map((opt:string, j:number) => (
                  <li key={j}>{String.fromCharCode(65 + j)}. {opt}</li>
                ))}
              </ul>
              <div style={{ color: "lightgreen" }}>Answer: {typeof q.answer === "number" ? String.fromCharCode(65 + q.answer) : q.answer}</div>
            </div>
          ))}
        </div>
      )}

      {raw && (
        <div style={{ marginTop: 20 }}>
          <h3>Raw (model / error)</h3>
          <pre style={{ background: "#111", color: "#fff", padding: 12 }}>{raw}</pre>
          <p>Copy this raw text and paste it into the chat with me if parsing fails — I'll fix the prompt for you.</p>
        </div>
      )}
    </div>
  );
}
