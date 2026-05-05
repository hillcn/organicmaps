"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaConfigManager = void 0;
const axios_1 = __importDefault(require("axios"));
const METASERVER_URL = 'https://meta.omaps.app/maps';
const DEFAULT_URLS_JSON = '{"servers":["https://cdn-nl1.organicmaps.app/","https://cdn-uk1.organicmaps.app/","https://cdn.organicmaps.app/"]}';
class MetaConfigManager {
    constructor() {
        this.servers = [];
        this.isInitialized = false;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            const response = await axios_1.default.get(METASERVER_URL);
            const config = response.data;
            this.servers = config.servers;
            console.log(`[MetaConfig] Loaded ${this.servers.length} servers from meta server`);
        }
        catch (error) {
            console.warn(`[MetaConfig] Failed to fetch from meta server, using defaults: ${error}`);
            const defaultConfig = JSON.parse(DEFAULT_URLS_JSON);
            this.servers = defaultConfig.servers;
        }
        this.isInitialized = true;
    }
    getServers() {
        return [...this.servers];
    }
    buildUrl(filePath) {
        return this.servers.map(server => `${server}${filePath}`);
    }
}
exports.MetaConfigManager = MetaConfigManager;
