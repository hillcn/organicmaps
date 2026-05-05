import axios from 'axios';
import { MetaConfig } from './types';

const METASERVER_URL = 'https://meta.omaps.app/maps';
const DEFAULT_URLS_JSON = '{"servers":["https://cdn-nl1.organicmaps.app/","https://cdn-uk1.organicmaps.app/","https://cdn.organicmaps.app/"]}';

export class MetaConfigManager {
  private servers: string[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const response = await axios.get(METASERVER_URL);
      const config: MetaConfig = response.data;
      this.servers = config.servers;
      console.log(`[MetaConfig] Loaded ${this.servers.length} servers from meta server`);
    } catch (error) {
      console.warn(`[MetaConfig] Failed to fetch from meta server, using defaults: ${error}`);
      const defaultConfig: MetaConfig = JSON.parse(DEFAULT_URLS_JSON);
      this.servers = defaultConfig.servers;
    }

    this.isInitialized = true;
  }

  getServers(): string[] {
    return [...this.servers];
  }

  buildUrl(filePath: string): string[] {
    return this.servers.map(server => `${server}${filePath}`);
  }
}
