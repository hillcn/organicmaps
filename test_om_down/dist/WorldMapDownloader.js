"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldMapDownloader = void 0;
const MetaConfigManager_1 = require("./MetaConfigManager");
const Downloader_1 = require("./Downloader");
class WorldMapDownloader {
    constructor(dataVersion, dataDir = './maps') {
        this.metaConfigManager = new MetaConfigManager_1.MetaConfigManager();
        this.downloader = new Downloader_1.Downloader(dataVersion, dataDir);
    }
    async initialize() {
        await this.metaConfigManager.initialize();
    }
    async downloadWorld() {
        const servers = this.metaConfigManager.getServers();
        const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/World.mwm`).join(',');
        const task = {
            countryId: 'World',
            fileName: 'World.mwm',
            fileType: 'map',
            url: urls,
            sha1: '',
            size: 0
        };
        this.downloader.enqueue(task);
    }
    async downloadWorldCoasts() {
        const servers = this.metaConfigManager.getServers();
        const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/WorldCoasts.mwm`).join(',');
        const task = {
            countryId: 'WorldCoasts',
            fileName: 'WorldCoasts.mwm',
            fileType: 'map',
            url: urls,
            sha1: '',
            size: 0
        };
        this.downloader.enqueue(task);
    }
    async downloadWithInfo(countryId, fileName, sha1, size) {
        const servers = this.metaConfigManager.getServers();
        const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/${fileName}`).join(',');
        const task = {
            countryId,
            fileName,
            fileType: 'map',
            url: urls,
            sha1,
            size
        };
        this.downloader.enqueue(task);
    }
    setIntegrityValidation(enabled) {
        this.downloader.setIntegrityValidation(enabled);
    }
    waitForCompletion() {
        return new Promise((resolve) => {
            const check = () => {
                if (this.downloader.getQueueSize() === 0 && !this.downloader.isDownloadingNow()) {
                    resolve();
                }
                else {
                    setTimeout(check, 1000);
                }
            };
            check();
        });
    }
}
exports.WorldMapDownloader = WorldMapDownloader;
