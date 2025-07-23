// Logging system for Cornerstones game

export class Logger {
    constructor() {
        this.isDevelopment = this.checkEnvironment();
    }

    checkEnvironment() {
        // Check if we're in development mode
        try {
            return (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '' ||
                window.location.protocol === 'file:'
            );
        } catch {
            return false;
        }
    }

    debug(message, ...args) {
        if (this.isDevelopment) {
            console.log(`🐛 [DEBUG] ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.isDevelopment) {
            console.log(`ℹ️ [INFO] ${message}`, ...args);
        }
    }

    success(message, ...args) {
        if (this.isDevelopment) {
            console.log(`✅ [SUCCESS] ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        console.warn(`⚠️ [WARN] ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }

    game(message, ...args) {
        if (this.isDevelopment) {
            console.log(`🎮 [GAME] ${message}`, ...args);
        }
    }

    performance(label, fn) {
        if (this.isDevelopment) {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
            return result;
        }
        return fn();
    }

    async performanceAsync(label, fn) {
        if (this.isDevelopment) {
            const start = performance.now();
            const result = await fn();
            const end = performance.now();
            console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
            return result;
        }
        return await fn();
    }
}

// Create singleton instance
const logger = new Logger();

// Export both the class and singleton
export { logger };
export default logger;