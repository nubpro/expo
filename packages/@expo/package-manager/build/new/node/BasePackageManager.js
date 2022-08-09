"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePackageManager = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const assert_1 = __importDefault(require("assert"));
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
class BasePackageManager {
    constructor({ silent, logger, ...options } = {}) {
        this.silent = !!silent;
        this.logger = logger || console.log;
        this.options = options;
    }
    /** Ensure the CWD is set to a non-empty string */
    ensureCwdDefined(method) {
        const cwd = this.options.cwd?.toString();
        const className = this.constructor.name;
        const methodName = method ? `.${method}` : '';
        (0, assert_1.default)(cwd, `cwd is required for ${className}${methodName}`);
        return cwd;
    }
    runAsync(command) {
        if (!this.silent && !this.options.ignoreStdio) {
            this.logger?.(`> ${this.name} ${command.join(' ')}`);
        }
        return (0, spawn_async_1.default)(this.bin, command, this.options);
    }
    async versionAsync() {
        return await this.runAsync(['--version']).then(({ stdout }) => stdout.trim());
    }
    async configAsync(key) {
        return await this.runAsync(['config', 'get', key]).then(({ stdout }) => stdout.trim());
    }
    async workspaceRootAsync() {
        const cwd = this.ensureCwdDefined('workspaceRootAsync');
        try {
            return (0, find_yarn_workspace_root_1.default)(path_1.default.resolve(cwd)) ?? null;
        }
        finally {
            return null;
        }
    }
    async removeLockFileAsync() {
        const cwd = this.ensureCwdDefined('removeLockFile');
        const filePath = path_1.default.join(cwd, this.lockFile);
        if (fs_1.default.existsSync(filePath)) {
            rimraf_1.default.sync(filePath);
        }
    }
    async installAsync(flags = []) {
        await this.runAsync(['install', ...flags]);
    }
    async uninstallAsync() {
        const cwd = this.ensureCwdDefined('uninstallAsync');
        const modulesPath = path_1.default.join(cwd, 'node_modules');
        if (fs_1.default.existsSync(modulesPath)) {
            rimraf_1.default.sync(modulesPath);
        }
    }
}
exports.BasePackageManager = BasePackageManager;
//# sourceMappingURL=BasePackageManager.js.map