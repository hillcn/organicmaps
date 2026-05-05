"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sha1_1 = require("./sha1");
class Downloader {
    constructor(dataVersion, dataDir = './maps') {
        this.dataVersion = dataVersion;
        this.dataDir = dataDir;
        this.downloadQueue = [];
        this.isDownloading = false;
        this.integrityValidation = true;
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    setIntegrityValidation(enabled) {
        this.integrityValidation = enabled;
    }
    enqueue(task) {
        if (!this.downloadQueue.find(t => t.countryId === task.countryId)) {
            this.downloadQueue.push(task);
            console.log(`[Downloader] Enqueued: ${task.countryId}`);
        }
        this.startNext();
    }
    async startNext() {
        if (this.isDownloading || this.downloadQueue.length === 0)
            return;
        this.isDownloading = true;
        const task = this.downloadQueue.shift();
        try {
            await this.downloadTask(task);
        }
        catch (error) {
            console.error(`[Downloader] Error downloading ${task.countryId}:`, error);
        }
        this.isDownloading = false;
        this.startNext();
    }
    async downloadTask(task) {
        console.log(`[Downloader] Starting download: ${task.countryId}`);
        const downloadPath = this.getDownloadPath(task);
        const tempPath = `${downloadPath}.downloading`;
        for (const url of task.url.split(',')) {
            try {
                console.log(`[Downloader] Trying: ${url.trim()}`);
                const response = await (0, axios_1.default)({
                    url: url.trim(),
                    method: 'GET',
                    responseType: 'stream',
                    onDownloadProgress: (progress) => {
                        const progressInfo = {
                            bytesDownloaded: progress.loaded,
                            bytesTotal: progress.total || task.size
                        };
                        this.onProgress(task.countryId, progressInfo);
                    }
                });
                await this.saveStream(response, tempPath);
                if (this.integrityValidation && task.sha1) {
                    console.log(`[Downloader] Validating SHA1 for ${task.countryId}`);
                    const actualSha1 = await sha1_1.SHA1.calculateAsync(tempPath);
                    if (actualSha1 !== task.sha1) {
                        fs.unlinkSync(tempPath);
                        throw new Error(`SHA1 mismatch for ${task.countryId}: expected ${task.sha1}, got ${actualSha1}`);
                    }
                    console.log(`[Downloader] SHA1 validation passed for ${task.countryId}`);
                }
                fs.renameSync(tempPath, downloadPath);
                this.onComplete(task.countryId, 'Completed');
                return;
            }
            catch (error) {
                console.warn(`[Downloader] Failed to download from ${url.trim()}:`, error);
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }
        }
        this.onComplete(task.countryId, 'Failed');
        throw new Error(`All servers failed for ${task.countryId}`);
    }
    async saveStream(response, filePath) {
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
    getDownloadPath(task) {
        const versionDir = path.join(this.dataDir, String(this.dataVersion));
        if (!fs.existsSync(versionDir)) {
            fs.mkdirSync(versionDir, { recursive: true });
        }
        return path.join(versionDir, task.fileName);
    }
    onProgress(countryId, progress) {
        const percentage = progress.bytesTotal > 0
            ? ((progress.bytesDownloaded / progress.bytesTotal) * 100).toFixed(2)
            : 'N/A';
        console.log(`[Downloader] Progress ${countryId}: ${percentage}% (${progress.bytesDownloaded}/${progress.bytesTotal})`);
    }
    onComplete(countryId, status) {
        console.log(`[Downloader] Download ${countryId}: ${status}`);
    }
    getQueueSize() {
        return this.downloadQueue.length;
    }
    getDataVersion() {
        return this.dataVersion;
    }
    isDownloadingNow() {
        return this.isDownloading;
    }
}
exports.Downloader = Downloader;
