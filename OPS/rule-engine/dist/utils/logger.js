"use strict";
// ============================================================================
// Logger Utility
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopLogger = exports.ConsoleLogger = void 0;
exports.setGlobalLogger = setGlobalLogger;
exports.getLogger = getLogger;
class ConsoleLogger {
    prefix;
    constructor(prefix = '[RuleEngine]') {
        this.prefix = prefix;
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    log(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        const output = `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}${metaStr}`;
        if (level === 'error') {
            console.error(output);
        }
        else if (level === 'warn') {
            console.warn(output);
        }
        else {
            console.log(output);
        }
    }
}
exports.ConsoleLogger = ConsoleLogger;
class NoopLogger {
    debug() { }
    info() { }
    warn() { }
    error() { }
}
exports.NoopLogger = NoopLogger;
let globalLogger = new ConsoleLogger();
function setGlobalLogger(logger) {
    globalLogger = logger;
}
function getLogger() {
    return globalLogger;
}
//# sourceMappingURL=logger.js.map