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
export declare function safeEval(code: string, context?: Record<string, any>, options?: SafeEvalOptions): Promise<SafeEvalResult>;
export declare function safeFunctionCall(code: string, functionName: string, args?: Record<string, any>, options?: SafeEvalOptions): Promise<SafeEvalResult>;
//# sourceMappingURL=safe-eval.d.ts.map