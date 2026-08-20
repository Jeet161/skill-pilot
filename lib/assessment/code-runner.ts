/**
 * Abstraction over code execution for CODE_OUTPUT / CODE_WRITING /
 * DEBUGGING questions. NEVER executes untrusted user code inside the
 * main Next.js process.
 *
 * In this build, no sandbox provider is wired up (that's an
 * infrastructure decision — e.g. a Firecracker/gVisor microVM, a
 * dedicated Judge0-style service, or a serverless sandbox like
 * E2B/Modal). Calling `runCode` will throw `CodeExecutionUnavailableError`
 * until a real provider is configured in `executeInSandbox` below, and
 * callers must degrade gracefully (fall back to AI-only evaluation of the
 * learner's reasoning rather than crashing the assessment).
 */

export interface CodeExecutionRequest {
  language: "python" | "javascript" | "typescript" | "java" | "cpp" | "sql";
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export class CodeExecutionUnavailableError extends Error {}

export async function runCode(req: CodeExecutionRequest): Promise<CodeExecutionResult> {
  return executeInSandbox(req);
}

/**
 * Swap this implementation for a real sandbox provider. Kept as a single
 * seam so the rest of the app never needs to know the execution backend.
 */
async function executeInSandbox(_req: CodeExecutionRequest): Promise<CodeExecutionResult> {
  throw new CodeExecutionUnavailableError(
    "No secure code execution provider is configured. Configure one (e.g. a sandboxed microVM or a service like E2B/Judge0) in lib/assessment/code-runner.ts. " +
      "Until then, code questions are evaluated by the AI diagnostician using the learner's written answer and reasoning alone."
  );
}

/**
 * Safe wrapper used by the orchestrator: attempts execution, and on
 * unavailability/failure returns `null` evidence rather than throwing,
 * so the assessment can continue using AI-only evaluation.
 */
export async function tryGetExecutionEvidence(
  req: CodeExecutionRequest
): Promise<string | null> {
  try {
    const result = await runCode(req);
    return [
      `exitCode=${result.exitCode}`,
      `timedOut=${result.timedOut}`,
      `stdout:\n${result.stdout.slice(0, 2000)}`,
      result.stderr ? `stderr:\n${result.stderr.slice(0, 1000)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return null;
  }
}
