/**
 * Drape Bridge - ArkTS 接口定义
 * 为 HarmonyOS 应用提供统一的图形后端抽象
 */

export enum ApiVersion {
  INVALID = -1,
  OPENGL_ES_3 = 0,
  METAL = 1,
  VULKAN = 2
}

export enum BufferType {
  VERTEX_BUFFER = 0,
  INDEX_BUFFER = 1
}

export interface BackendDescriptor {
  apiVersion: ApiVersion;
  name: string;
  description: string;
  priority: number;
  isSupported: boolean;
}

export interface GraphicsContext {
  readonly apiVersion: ApiVersion;
  readonly rendererName: string;
  readonly rendererVersion: string;

  init(apiVersion: ApiVersion): void;
  beginRendering(): boolean;
  endRendering(): void;
  present(): void;
  makeCurrent(): void;
  doneCurrent(): void;
}

export interface Texture {
  readonly width: number;
  readonly height: number;

  bind(): void;
  unbind(): void;
  uploadData(data: ArrayBuffer): void;
}

export interface Buffer {
  readonly bufferType: BufferType;
  readonly size: number;

  bind(): void;
  unbind(): void;
  uploadData(data: ArrayBuffer): void;
}

export interface Framebuffer {
  readonly width: number;
  readonly height: number;

  bind(): void;
  unbind(): void;
}

export interface ResourceFactory {
  readonly apiVersion: ApiVersion;

  createTexture(width: number, height: number): Texture;
  createBuffer(bufferType: BufferType, size: number): Buffer;
  createFramebuffer(width: number, height: number): Framebuffer;
}

export interface ContextFactory {
  createContext(): GraphicsContext;
  createResourceFactory(apiVersion: ApiVersion): ResourceFactory;
}

export interface BackendRegistry {
  registerBackend(factory: ContextFactory): void;
  getAvailableBackends(): BackendDescriptor[];
  getBestBackend(): BackendDescriptor | null;
  getBackend(apiVersion: ApiVersion): BackendDescriptor | null;
  createContextFactory(apiVersion: ApiVersion): ContextFactory | null;
  createDefaultFactory(): ContextFactory | null;
  createResourceFactory(apiVersion: ApiVersion): ResourceFactory | null;
  createDefaultResourceFactory(): ResourceFactory | null;
}

class BackendRegistryImpl implements BackendRegistry {
  private factories: Map<ApiVersion, ContextFactory> = new Map();
  private initialized: boolean = false;

  registerBackend(factory: ContextFactory): void {
    const context = factory.createContext();
    this.factories.set(context.apiVersion, factory);
    this.initialized = true;
  }

  getAvailableBackends(): BackendDescriptor[] {
    const backends: BackendDescriptor[] = [];

    this.factories.forEach((factory, apiVersion) => {
      const context = factory.createContext();
      backends.push({
        apiVersion: context.apiVersion,
        name: context.rendererName,
        description: `${context.rendererName} Backend`,
        priority: this.getPriorityForApi(context.apiVersion),
        isSupported: true
      });
    });

    return backends.sort((a, b) => b.priority - a.priority);
  }

  getBestBackend(): BackendDescriptor | null {
    const backends = this.getAvailableBackends();
    return backends.length > 0 ? backends[0] : null;
  }

  getBackend(apiVersion: ApiVersion): BackendDescriptor | null {
    return this.getAvailableBackends().find(b => b.apiVersion === apiVersion) || null;
  }

  createContextFactory(apiVersion: ApiVersion): ContextFactory | null {
    return this.factories.get(apiVersion) || null;
  }

  createDefaultFactory(): ContextFactory | null {
    const best = this.getBestBackend();
    return best ? this.createContextFactory(best.apiVersion) : null;
  }

  createResourceFactory(apiVersion: ApiVersion): ResourceFactory | null {
    const factory = this.factories.get(apiVersion);
    return factory ? factory.createResourceFactory(apiVersion) : null;
  }

  createDefaultResourceFactory(): ResourceFactory | null {
    const best = this.getBestBackend();
    return best ? this.createResourceFactory(best.apiVersion) : null;
  }

  private getPriorityForApi(apiVersion: ApiVersion): number {
    switch (apiVersion) {
      case ApiVersion.METAL:
        return 100;
      case ApiVersion.VULKAN:
        return 80;
      case ApiVersion.OPENGL_ES_3:
        return 50;
      default:
        return 0;
    }
  }
}

export const backendRegistry: BackendRegistry = new BackendRegistryImpl();

export class GraphicsManager {
  private context: GraphicsContext | null = null;
  private resourceFactory: ResourceFactory | null = null;
  private backend: BackendDescriptor | null = null;

  initialize(): boolean {
    this.backend = backendRegistry.getBestBackend();
    if (!this.backend) {
      console.error('No available graphics backend');
      return false;
    }

    const factory = backendRegistry.createContextFactory(this.backend.apiVersion);
    if (!factory) {
      console.error('Failed to create context factory');
      return false;
    }

    this.context = factory.createContext();
    this.context.init(this.backend.apiVersion);

    if (!this.context.beginRendering()) {
      console.error('Failed to begin rendering');
      return false;
    }

    this.resourceFactory = factory.createResourceFactory(this.backend.apiVersion);
    console.info(`Graphics initialized with ${this.backend.name}`);

    return true;
  }

  shutdown(): void {
    if (this.context) {
      this.context.endRendering();
      this.context.present();
      this.context = null;
    }
    this.resourceFactory = null;
    this.backend = null;
    console.info('Graphics shutdown complete');
  }

  createTexture(width: number, height: number): Texture | null {
    return this.resourceFactory?.createTexture(width, height) || null;
  }

  createBuffer(bufferType: BufferType, size: number): Buffer | null {
    return this.resourceFactory?.createBuffer(bufferType, size) || null;
  }

  createFramebuffer(width: number, height: number): Framebuffer | null {
    return this.resourceFactory?.createFramebuffer(width, height) || null;
  }

  getBackendName(): string {
    return this.backend?.name || 'Unknown';
  }

  getApiVersion(): ApiVersion {
    return this.backend?.apiVersion || ApiVersion.INVALID;
  }
}
