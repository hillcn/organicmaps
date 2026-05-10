/**
 * Drape Bridge ArkTS 快速入门示例
 */

// 导入核心接口
import {
  backendRegistry,
  GraphicsManager,
  ApiVersion,
  BufferType,
  type GraphicsContext,
  type ResourceFactory,
  type Texture,
  type Buffer,
  type Framebuffer,
  type BackendDescriptor
} from './drape/BackendRegistry';

// 导入后端实现
import { registerOpenGLBackend } from './drape/opengl/OpenGLBackend';
import { registerVulkanBackend } from './drape/vulkan/VulkanBackend';
import { registerMetalBackend } from './drape/metal/MetalBackend';

/**
 * 示例 1: 基础初始化
 */
export function basicInitialization(): boolean {
  // 注册后端
  registerOpenGLBackend();

  // 创建图形管理器
  const manager = new GraphicsManager();

  // 初始化
  const success = manager.initialize();

  if (success) {
    console.info(`Using backend: ${manager.getBackendName()}`);
    console.info(`API Version: ${manager.getApiVersion()}`);
  }

  return success;
}

/**
 * 示例 2: 自动选择最佳后端
 */
export function autoSelectBestBackend(): void {
  // 注册所有可用后端
  registerOpenGLBackend();
  registerVulkanBackend();
  registerMetalBackend();

  // 获取最佳后端
  const best = backendRegistry.getBestBackend();

  if (best) {
    console.info(`Best backend: ${best.name}`);
    console.info(`Priority: ${best.priority}`);
  }
}

/**
 * 示例 3: 列举所有可用后端
 */
export function listAllBackends(): void {
  registerOpenGLBackend();
  registerVulkanBackend();

  const backends = backendRegistry.getAvailableBackends();

  console.info(`Found ${backends.length} backend(s):`);

  for (const backend of backends) {
    console.info(`- ${backend.name}`);
    console.info(`  API Version: ${backend.apiVersion}`);
    console.info(`  Priority: ${backend.priority}`);
    console.info(`  Supported: ${backend.isSupported}`);
  }
}

/**
 * 示例 4: 创建图形资源
 */
export function createGraphicsResources(): void {
  const manager = new GraphicsManager();

  if (!manager.initialize()) {
    console.error('Failed to initialize graphics');
    return;
  }

  // 创建纹理
  const texture = manager.createTexture(1024, 768);
  if (texture) {
    console.info(`Texture created: ${texture.width}x${texture.height}`);
    texture.bind();
    texture.uploadData(new ArrayBuffer(1024 * 768 * 4));
    texture.unbind();
  }

  // 创建顶点缓冲区
  const vertexBuffer = manager.createBuffer(BufferType.VERTEX_BUFFER, 1024);
  if (vertexBuffer) {
    console.info(`Vertex buffer created: ${vertexBuffer.size} bytes`);
    vertexBuffer.bind();
    vertexBuffer.uploadData(new ArrayBuffer(1024));
    vertexBuffer.unbind();
  }

  // 创建索引缓冲区
  const indexBuffer = manager.createBuffer(BufferType.INDEX_BUFFER, 256);
  if (indexBuffer) {
    console.info(`Index buffer created: ${indexBuffer.size} bytes`);
    indexBuffer.bind();
    indexBuffer.uploadData(new ArrayBuffer(256));
    indexBuffer.unbind();
  }

  // 创建帧缓冲区
  const framebuffer = manager.createFramebuffer(1920, 1080);
  if (framebuffer) {
    console.info(`Framebuffer created: ${framebuffer.width}x${framebuffer.height}`);
    framebuffer.bind();
    framebuffer.unbind();
  }

  // 关闭
  manager.shutdown();
}

/**
 * 示例 5: 完整渲染循环
 */
export class RenderingExample {
  private manager: GraphicsManager = new GraphicsManager();
  private texture: Texture | null = null;
  private vertexBuffer: Buffer | null = null;
  private running: boolean = false;

  async start(): Promise<void> {
    // 初始化
    if (!this.manager.initialize()) {
      console.error('Failed to initialize graphics');
      return;
    }

    // 创建资源
    this.createResources();

    // 开始渲染循环
    this.running = true;
    this.renderLoop();
  }

  private createResources(): void {
    // 创建纹理
    this.texture = this.manager.createTexture(512, 512);
    if (this.texture) {
      this.texture.bind();
      const data = new ArrayBuffer(512 * 512 * 4);
      this.texture.uploadData(data);
      this.texture.unbind();
    }

    // 创建顶点缓冲区
    this.vertexBuffer = this.manager.createBuffer(BufferType.VERTEX_BUFFER, 1024);
    if (this.vertexBuffer) {
      this.vertexBuffer.bind();
      const data = new ArrayBuffer(1024);
      this.vertexBuffer.uploadData(data);
      this.vertexBuffer.unbind();
    }
  }

  private renderLoop(): void {
    if (!this.running) {
      return;
    }

    // 开始渲染
    const context = this.manager['context'];
    if (context && context.beginRendering()) {
      // 渲染逻辑
      this.render();

      // 结束渲染
      context.endRendering();
      context.present();
    }

    // 继续下一帧
    setTimeout(() => this.renderLoop(), 16);
  }

  private render(): void {
    // 绑定资源
    if (this.texture) {
      this.texture.bind();
    }
    if (this.vertexBuffer) {
      this.vertexBuffer.bind();
    }

    // 执行绘制命令
    this.draw();

    // 解绑资源
    if (this.vertexBuffer) {
      this.vertexBuffer.unbind();
    }
    if (this.texture) {
      this.texture.unbind();
    }
  }

  private draw(): void {
    // 实际的绘制逻辑
    console.debug('Drawing frame...');
  }

  stop(): void {
    this.running = false;

    // 清理资源
    this.texture = null;
    this.vertexBuffer = null;

    // 关闭
    this.manager.shutdown();
  }
}

/**
 * 示例 6: 错误处理
 */
export function errorHandling(): void {
  const manager = new GraphicsManager();

  try {
    // 尝试初始化
    const success = manager.initialize();

    if (!success) {
      console.warn('Graphics initialization failed, using fallback');

      // 尝试回退到特定后端
      const factory = backendRegistry.createContextFactory(ApiVersion.OPENGL_ES_3);
      if (factory) {
        console.info('Fallback to OpenGL ES 3.0');
      } else {
        throw new Error('No available graphics backend');
      }
    }

    // 正常操作
    const texture = manager.createTexture(1920, 1080);
    if (!texture) {
      throw new Error('Failed to create texture');
    }

    console.info('All operations completed successfully');

  } catch (error) {
    console.error(`Error: ${error}`);
  } finally {
    manager.shutdown();
  }
}

/**
 * 示例 7: 多后端切换
 */
export function multiBackendSwitching(): void {
  // 注册后端
  registerOpenGLBackend();
  registerVulkanBackend();

  // 测试 OpenGL
  console.info('Testing OpenGL backend...');
  const glFactory = backendRegistry.createContextFactory(ApiVersion.OPENGL_ES_3);
  if (glFactory) {
    const ctx = glFactory.createContext();
    ctx.init(ApiVersion.OPENGL_ES_3);
    console.info(`OpenGL: ${ctx.rendererName} ${ctx.rendererVersion}`);
  }

  // 测试 Vulkan
  console.info('Testing Vulkan backend...');
  const vkFactory = backendRegistry.createContextFactory(ApiVersion.VULKAN);
  if (vkFactory) {
    const ctx = vkFactory.createContext();
    ctx.init(ApiVersion.VULKAN);
    console.info(`Vulkan: ${ctx.rendererName} ${ctx.rendererVersion}`);
  }
}
