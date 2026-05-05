import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { DownloadTask, DownloadProgress, DownloadStatus } from './types';
import { SHA1 } from './sha1';

export class Downloader {
  private downloadQueue: DownloadTask[] = [];
  private isDownloading = false;
  private integrityValidation = true;

  constructor(private dataVersion: number, private dataDir: string = './maps') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  setIntegrityValidation(enabled: boolean): void {
    this.integrityValidation = enabled;
  }

  enqueue(task: DownloadTask): void {
    if (!this.downloadQueue.find(t => t.countryId === task.countryId)) {
      this.downloadQueue.push(task);
      console.log(`[Downloader] Enqueued: ${task.countryId}`);
    }
    this.startNext();
  }

  private async startNext(): Promise<void> {
    if (this.isDownloading || this.downloadQueue.length === 0) return;

    this.isDownloading = true;
    const task = this.downloadQueue.shift()!;

    try {
      await this.downloadTask(task);
    } catch (error) {
      console.error(`[Downloader] Error downloading ${task.countryId}:`, error);
    }

    this.isDownloading = false;
    this.startNext();
  }

  private async downloadTask(task: DownloadTask): Promise<void> {
    console.log(`[Downloader] Starting download: ${task.countryId}`);

    const downloadPath = this.getDownloadPath(task);
    const tempPath = `${downloadPath}.downloading`;

    for (const url of task.url.split(',')) {
      try {
        console.log(`[Downloader] Trying: ${url.trim()}`);
        
        const response = await axios({
          url: url.trim(),
          method: 'GET',
          responseType: 'stream',
          onDownloadProgress: (progress) => {
            const progressInfo: DownloadProgress = {
              bytesDownloaded: progress.loaded,
              bytesTotal: progress.total || task.size
            };
            this.onProgress(task.countryId, progressInfo);
          }
        });

        await this.saveStream(response, tempPath);

        if (this.integrityValidation && task.sha1) {
          console.log(`[Downloader] Validating SHA1 for ${task.countryId}`);
          const actualSha1 = await SHA1.calculateAsync(tempPath);
          
          if (actualSha1 !== task.sha1) {
            fs.unlinkSync(tempPath);
            throw new Error(`SHA1 mismatch for ${task.countryId}: expected ${task.sha1}, got ${actualSha1}`);
          }
          console.log(`[Downloader] SHA1 validation passed for ${task.countryId}`);
        }

        fs.renameSync(tempPath, downloadPath);
        this.onComplete(task.countryId, 'Completed');
        return;

      } catch (error) {
        console.warn(`[Downloader] Failed to download from ${url.trim()}:`, error);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }

    this.onComplete(task.countryId, 'Failed');
    throw new Error(`All servers failed for ${task.countryId}`);
  }

  private async saveStream(response: AxiosResponse<NodeJS.ReadableStream>, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private getDownloadPath(task: DownloadTask): string {
    const versionDir = path.join(this.dataDir, String(this.dataVersion));
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }
    return path.join(versionDir, task.fileName);
  }

  private onProgress(countryId: string, progress: DownloadProgress): void {
    const percentage = progress.bytesTotal > 0 
      ? ((progress.bytesDownloaded / progress.bytesTotal) * 100).toFixed(2) 
      : 'N/A';
    console.log(`[Downloader] Progress ${countryId}: ${percentage}% (${progress.bytesDownloaded}/${progress.bytesTotal})`);
  }

  private onComplete(countryId: string, status: DownloadStatus): void {
    console.log(`[Downloader] Download ${countryId}: ${status}`);
  }

  getQueueSize(): number {
    return this.downloadQueue.length;
  }

  getDataVersion(): number {
    return this.dataVersion;
  }

  isDownloadingNow(): boolean {
    return this.isDownloading;
  }
}
