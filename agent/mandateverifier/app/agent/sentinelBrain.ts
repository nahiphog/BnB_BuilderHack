/**
 * Sentinel's brain: the SAME LLM configured for this Agent Studio project
 * (studio.toml [llm], Pieverse free tier by default). Text in, text out.
 * It has NO tools and NO wallet: it can only suggest. Fixed code decides
 * whether a suggestion is allowed to be signed.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStudioToml, type TomlTable } from "@bnbagent/studio-runtime/config";
import { resolveModel } from "@bnbagent/studio-runtime/llm";
import { generateText, type LanguageModel } from "ai";

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = join(APP_DIR, "..", "..");

/** Load the workspace .studio/.env.local into process.env without printing anything. */
function loadEnv(): void {
  const file = join(WORKSPACE, ".studio", ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

let model: LanguageModel | null = null;
let modelName = "";

function getModel(): LanguageModel {
  if (model) return model;
  loadEnv();
  const prev = process.cwd();
  process.chdir(APP_DIR); // loadStudioToml reads studio.toml from the project
  try {
    const llm = (loadStudioToml().llm ?? {}) as TomlTable;
    modelName = `${String(llm.provider)}/${String(llm.model)}`;
    model = resolveModel(llm) as LanguageModel;
  } finally {
    process.chdir(prev);
  }
  return model;
}

export function brainName(): string {
  try {
    getModel();
  } catch {
    /* reported by think() */
  }
  return modelName || "unavailable";
}

export async function think(system: string, prompt: string, timeoutMs = 45_000): Promise<string> {
  const res = await generateText({
    model: getModel(),
    system,
    prompt,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return res.text.trim();
}
