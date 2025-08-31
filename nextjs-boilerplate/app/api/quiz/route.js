// app/api/quiz/route.js
import { NextResponse } from "next/server";
import { spawn } from "child_process";

/*
  Simple backend that runs the local Ollama CLI (ollama run <model>)
  and extracts a JSON array from the model output.

  IMPORTANT:
  - If your model name is not "llama3", replace "llama3" below with your model name.
  - Start Ollama (ollama serve) first in a separate terminal (or make sure it is running).
*/

export async function POST(req) {
  try {
    const body = await req.json();
    const topic = (body.topic || "General Knowledge").trim();
    const difficulty = (body.difficulty || "easy").trim();

    const prompt = `You are a strict QUIZ GENERATOR.
Generate exactly 5 multiple-choice questions about "${topic}" at ${difficulty} difficulty.
Return ONLY valid JSON: a single JSON array of objects.
Each object must have keys: "question" (string), "options" (array of exactly 4 strings), "answer" (index 0-3).
Example output:
[
  { "question": "Q1?", "options": ["A","B","C","D"], "answer": 0 },
  ...
]
DO NOT add any extra commentary, headers, or explanation. Output only the JSON array.` + "\n";

    // Run: "ollama run llama3" (writes prompt to stdin, reads stdout)
    return await new Promise((resolve) => {
      let out = "";
      let err = "";

      // If your model name is different, change "llama3" below
      const child = spawn("ollama", ["run", "llama3"], { stdio: ["pipe", "pipe", "pipe"] });

      child.stdin.write(prompt);
      child.stdin.end();

      child.stdout.on("data", (d) => { out += d.toString(); });
      child.stderr.on("data", (d) => { err += d.toString(); });

      child.on("close", () => {
        // Try to extract the JSON array from the model output (first [ ... last ])
        const start = out.indexOf("[");
        const end = out.lastIndexOf("]");

        if (start !== -1 && end !== -1 && end > start) {
          const jsonText = out.slice(start, end + 1);
          try {
            const quiz = JSON.parse(jsonText);
            resolve(NextResponse.json({ success: true, quiz }));
            return;
          } catch (parseErr) {
            // send raw output back so frontend can show it
            resolve(NextResponse.json({
              success: false,
              error: "parse_error",
              message: "Model output could not be parsed as JSON",
              raw: out,
              stderr: err
            }));
            return;
          }
        }

        // If we didn't find JSON array at all:
        resolve(NextResponse.json({
          success: false,
          error: "no_json_found",
          message: "Model did not return a JSON array",
          raw: out,
          stderr: err
        }));
      });

      // safety: if child fails immediately
      child.on("error", (spawnErr) => {
        resolve(NextResponse.json({
          success: false,
          error: "spawn_error",
          message: spawnErr.message
        }));
      });
    });

  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
