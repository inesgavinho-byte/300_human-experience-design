"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePython = executePython;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const DEFAULT_TIMEOUT_MS = 5000;
/**
 * Execute a Python rule expression via a child process.
 *
 * The Python code must define a function named `calculate` that accepts
 * a context dict and returns a dict with outputs.
 *
 * Example:
 *   def calculate(context):
 *       base = (context['room']['area_m2'] + 3) // 4
 *       return {"spots": {"min": base, "max": int(base * 1.3)}}
 */
async function executePython(expression, context, options = {}) {
    const logger = (0, logger_1.getLogger)();
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const pythonPath = options.pythonPath ?? 'python3';
    logger.debug('Executing Python DSL', { expressionLength: expression.length });
    // Build a Python script that:
    // 1. Receives the context as JSON via stdin
    // 2. Executes the user expression
    // 3. Calls calculate(context)
    // 4. Prints the result as JSON to stdout
    const wrapperScript = `
import sys
import json

context_json = sys.stdin.read()
context = json.loads(context_json)

${expression}

if 'calculate' not in dir():
    print(json.dumps({"__error": "Function 'calculate' is not defined"}), flush=True)
    sys.exit(1)

try:
    result = calculate(context)
    if not isinstance(result, dict):
        print(json.dumps({"__error": "Rule must return a dict"}), flush=True)
        sys.exit(1)
    print(json.dumps(result), flush=True)
except Exception as e:
    print(json.dumps({"__error": str(e)}), flush=True)
    sys.exit(1)
`;
    return new Promise((resolve) => {
        const logs = [];
        const child = (0, child_process_1.spawn)(pythonPath, ['-c', wrapperScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
        }, timeoutMs);
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
            logs.push(`[PYTHON STDERR] ${data.toString().trim()}`);
        });
        child.on('close', (code) => {
            clearTimeout(timeout);
            if (timedOut) {
                resolve({
                    success: false,
                    error: `Python execution timed out after ${timeoutMs}ms`,
                    logs,
                    executionTimeMs: Date.now() - startTime,
                });
                return;
            }
            if (code !== 0) {
                resolve({
                    success: false,
                    error: `Python process exited with code ${code}. stderr: ${stderr}`,
                    logs,
                    executionTimeMs: Date.now() - startTime,
                });
                return;
            }
            try {
                const result = JSON.parse(stdout.trim());
                if (result.__error) {
                    resolve({
                        success: false,
                        error: result.__error,
                        logs,
                        executionTimeMs: Date.now() - startTime,
                    });
                    return;
                }
                resolve({
                    success: true,
                    outputs: result,
                    logs,
                    executionTimeMs: Date.now() - startTime,
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to parse Python output: ${err?.message ?? String(err)}. stdout: ${stdout}`,
                    logs,
                    executionTimeMs: Date.now() - startTime,
                });
            }
        });
        child.on('error', (err) => {
            clearTimeout(timeout);
            resolve({
                success: false,
                error: `Failed to start Python process: ${err.message}`,
                logs,
                executionTimeMs: Date.now() - startTime,
            });
        });
        // Send context as JSON to Python stdin
        child.stdin?.write(JSON.stringify(context));
        child.stdin?.end();
    });
}
//# sourceMappingURL=python-dsl.js.map