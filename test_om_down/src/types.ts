export interface MetaConfig {
  servers: string[];
  settings: Record<string, string>;
}

export interface CountryInfo {
  id: string;
  name: string;
  size: number;
  sha1: string;
}

export type DownloadStatus = 
  | 'InProgress'
  | 'Completed'
  | 'Failed'
  | 'FileNotFound'
  | 'FailedSHA';

export interface DownloadProgress {
  bytesDownloaded: number;
  bytesTotal: number;
}

export interface DownloadTask {
  countryId: string;
  fileName: string;
  fileType: 'map' | 'diff';
  url: string;
  sha1: string;
  size: number;
}
