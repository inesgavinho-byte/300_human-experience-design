export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface Logger {
    debug(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    error(message: string, meta?: Record<string, any>): void;
}
export declare class ConsoleLogger implements Logger {
    private readonly prefix;
    constructor(prefix?: string);
    debug(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    error(message: string, meta?: Record<string, any>): void;
    private log;
}
export declare class NoopLogger implements Logger {
    debug(): void;
    info(): void;
    warn(): void;
    error(): void;
}
export declare function setGlobalLogger(logger: Logger): void;
export declare function getLogger(): Logger;
//# sourceMappingURL=logger.d.ts.map