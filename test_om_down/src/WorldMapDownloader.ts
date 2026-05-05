import { MetaConfigManager } from './MetaConfigManager';
import { Downloader } from './Downloader';
import { DownloadTask } from './types';

export class WorldMapDownloader {
  private metaConfigManager: MetaConfigManager;
  private downloader: Downloader;

  constructor(dataVersion: number, dataDir: string = './maps') {
    this.metaConfigManager = new MetaConfigManager();
    this.downloader = new Downloader(dataVersion, dataDir);
  }

  async initialize(): Promise<void> {
    await this.metaConfigManager.initialize();
  }

  async downloadWorld(): Promise<void> {
    const servers = this.metaConfigManager.getServers();
    const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/World.mwm`).join(',');
    
    const task: DownloadTask = {
      countryId: 'World',
      fileName: 'World.mwm',
      fileType: 'map',
      url: urls,
      sha1: '',
      size: 0
    };

    this.downloader.enqueue(task);
  }

  async downloadWorldCoasts(): Promise<void> {
    const servers = this.metaConfigManager.getServers();
    const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/WorldCoasts.mwm`).join(',');
    
    const task: DownloadTask = {
      countryId: 'WorldCoasts',
      fileName: 'WorldCoasts.mwm',
      fileType: 'map',
      url: urls,
      sha1: '',
      size: 0
    };

    this.downloader.enqueue(task);
  }

  async downloadWithInfo(countryId: string, fileName: string, sha1: string, size: number): Promise<void> {
    const servers = this.metaConfigManager.getServers();
    const urls = servers.map(s => `${s}maps/${this.downloader.getDataVersion()}/${fileName}`).join(',');
    
    const task: DownloadTask = {
      countryId,
      fileName,
      fileType: 'map',
      url: urls,
      sha1,
      size
    };

    this.downloader.enqueue(task);
  }

  setIntegrityValidation(enabled: boolean): void {
    this.downloader.setIntegrityValidation(enabled);
  }

  waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.downloader.getQueueSize() === 0 && !this.downloader.isDownloadingNow()) {
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      };
      check();
    });
  }
}
