import { runInNewContext } from 'vm';

// ============================================================================
// Safe Evaluation Utilities
// ============================================================================

const DEFAULT_TIMEOUT_MS = 5000;

export interface SafeEvalOptions {
  timeoutMs?: number;
}

export interface SafeEvalResult {
  success: boolean;
  result?: any;
  error?: string;
  logs: string[];
  executionTimeMs: number;
}

function createLogCapture(): { logs: string[]; push: (...args: any[]) => void } {
  const logs: string[] = [];
  return {
    logs,
    push: (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
  };
}

export async function safeEval(
  code: string,
  context: Record<string, any> = {},
  options: SafeEvalOptions = {}
): Promise<SafeEvalResult> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const logCapture = createLogCapture();

    const sandbox: Record<string, any> = {
      console: {
        log: logCapture.push,
        error: (...args: any[]) => logCapture.push('[ERROR]', ...args),
        warn: (...args: any[]) => logCapture.push('[WARN]', ...args),
        info: (...args: any[]) => logCapture.push('[INFO]', ...args),
      },
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      TypeError,
      RangeError,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Infinity,
      NaN,
      undefined,
    };

    for (const [key, value] of Object.entries(context)) {
      sandbox[key] = value;
    }

    const result = runInNewContext(code, sandbox, {
      timeout: timeoutMs,
      displayErrors: true,
    });

    return {
      success: true,
      result,
      logs: logCapture.logs,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? String(err),
      logs: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export async function safeFunctionCall(
  code: string,
  functionName: string,
  args: Record<string, any> = {},
  options?: SafeEvalOptions
): Promise<SafeEvalResult> {
  const argValues = Object.values(args);
  const serializedArgs = argValues.map(v => JSON.stringify(v)).join(', ');

  const wrappedCode = `${code}\nif (typeof ${functionName} !== 'function') {\n  throw new Error('Function "${functionName}" is not defined in rule expression');\n}\n${functionName}(${serializedArgs})`;

  return safeEval(wrappedCode, {}, options);
}
