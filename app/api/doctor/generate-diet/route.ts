// app/api/create-diet/route.ts
export const runtime = "nodejs"; // ensure Node runtime so child_process is available

import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { platform, cwd } from "process";

// Constants
const PYTHON_PATH = platform === "win32" ? "python" : "python3";
const MODEL_PATH = path.join(cwd(), "model", "model.py");
const TEMP_DIR = path.join(cwd(), "tmp");

type RunModelResult = Record<string, unknown>;

/**
 * Run the python model script with a JSON input file and return parsed JSON output.
 */
async function runModel(dosha: string, avoid: string[]): Promise<RunModelResult> {
  return new Promise((resolve, reject) => {
    const pythonPath = "python3"; // change to "python" if your environment uses that
    const scriptPath = path.join(process.cwd(), "model", "model.py");

    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`model.py not found at ${scriptPath}`));
    }

    // Prepare temporary JSON input inside the model folder
    const inputPath = path.join(process.cwd(), "model", "input.json");
    try {
      fs.writeFileSync(inputPath, JSON.stringify({ dosha, avoid }, null, 2), "utf8");
    } catch (err) {
      return reject(new Error(`Failed to write input file: ${(err as Error).message}`));
    }

    // Spawn python process
    const pyProc = spawn(pythonPath, [scriptPath, inputPath], {
      cwd: path.join(process.cwd(), "model"),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    pyProc.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    pyProc.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    pyProc.on("error", (err) => {
      return reject(new Error(`Failed to start python process: ${err.message}`));
    });

    pyProc.on("close", (code) => {
      // Clean up input file (best-effort)
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      } catch (e) {
        // ignore cleanup errors
      }

      if (code !== 0) {
        const message = stderr || `Python process exited with code ${code}`;
        return reject(new Error(message));
      }

      // Try to parse stdout as JSON. The model should print a single JSON object.
      const trimmed = stdout.trim();
      if (!trimmed) {
        // No output
        return reject(new Error(`No output from python script. Stderr: ${stderr}`));
      }

      try {
        const parsed = JSON.parse(trimmed);
        resolve(parsed as RunModelResult);
      } catch (parseErr) {
        // If stdout contains logs + JSON, try to extract last JSON block
        const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])$/);
        if (jsonMatch) {
          try {
            const parsed2 = JSON.parse(jsonMatch[0]);
            return resolve(parsed2 as RunModelResult);
          } catch {
            // fall-through
          }
        }
        const errMsg = `Failed to parse JSON output from python script. Parse error: ${(parseErr as Error).message}. Stdout: ${trimmed}. Stderr: ${stderr}`;
        return reject(new Error(errMsg));
      }
    });
  });
}

/**
 * POST /api/create-diet
 * body: { dosha: string, avoid?: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const dosha = (body && body.dosha) ? String(body.dosha).toLowerCase() : null;
    const avoid = Array.isArray(body && body.avoid) ? (body.avoid as string[]) : [];

    if (!dosha || !["vata", "pitta", "kapha", "mixed"].includes(dosha)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'dosha' field. Use 'vata', 'pitta', 'kapha' or 'mixed'." },
        { status: 400 }
      );
    }

    // run python model
    const result = await runModel(dosha, avoid);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err: any) {
    console.error("create-diet error:", err);
    const message = err?.message || String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
