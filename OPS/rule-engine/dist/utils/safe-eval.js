"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEval = safeEval;
exports.safeFunctionCall = safeFunctionCall;
const vm_1 = require("vm");
// ============================================================================
// Safe Evaluation Utilities
// ============================================================================
const DEFAULT_TIMEOUT_MS = 5000;
function createLogCapture() {
    const logs = [];
    return {
        logs,
        push: (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        },
    };
}
async function safeEval(code, context = {}, options = {}) {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
        const logCapture = createLogCapture();
        const sandbox = {
            console: {
                log: logCapture.push,
                error: (...args) => logCapture.push('[ERROR]', ...args),
                warn: (...args) => logCapture.push('[WARN]', ...args),
                info: (...args) => logCapture.push('[INFO]', ...args),
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
        const result = (0, vm_1.runInNewContext)(code, sandbox, {
            timeout: timeoutMs,
            displayErrors: true,
        });
        return {
            success: true,
            result,
            logs: logCapture.logs,
            executionTimeMs: Date.now() - startTime,
        };
    }
    catch (err) {
        return {
            success: false,
            error: err?.message ?? String(err),
            logs: [],
            executionTimeMs: Date.now() - startTime,
        };
    }
}
async function safeFunctionCall(code, functionName, args = {}, options) {
    const argValues = Object.values(args);
    const serializedArgs = argValues.map(v => JSON.stringify(v)).join(', ');
    const wrappedCode = `${code}\nif (typeof ${functionName} !== 'function') {\n  throw new Error('Function "${functionName}" is not defined in rule expression');\n}\n${functionName}(${serializedArgs})`;
    return safeEval(wrappedCode, {}, options);
}
//# sourceMappingURL=safe-eval.js.map