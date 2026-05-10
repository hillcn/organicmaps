# Drape Bridge ArkTS 使用指南

## 概述

Drape Bridge ArkTS 为 HarmonyOS 应用提供统一的图形后端抽象，支持 OpenGL ES 3.0、Vulkan 和 Metal 三种图形 API。

## 目录结构

```
arkts-drape-bridge/
├── src/
│   └── main/
│       └── ets/
│           ├── drape/
│           │   ├── BackendRegistry.ets          # 核心接口和注册表
│           │   ├── opengl/
│           │   │   └── OpenGLBackend.ets         # OpenGL 后端实现
│           │   ├── vulkan/
│           │   │   └── VulkanBackend.ets         # Vulkan 后端实现
│           │   └── metal/
│           │       └── MetalBackend.ets          # Metal 后端实现
│           └── Example.ets                       # 使用示例
├── module.json5                                  # 模块配置
└── src/
    └── main/
        └── resources/
            └── base/
                └── element/
                    └── string.json              # 资源文件
```

## 快速开始

### 1. 导入模块

```typescript
import {
  backendRegistry,
  GraphicsManager,
  ApiVersion,
  BufferType
} from './drape/BackendRegistry';

import { registerOpenGLBackend } from './drape/opengl/OpenGLBackend';
import { registerVulkanBackend } from './drape/vulkan/VulkanBackend';
import { registerMetalBackend } from './drape/metal/MetalBackend';
```

### 2. 初始化图形系统

```typescript
// 注册后端
registerOpenGLBackend();
registerVulkanBackend();

// 创建管理器
const manager = new GraphicsManager();

// 初始化
if (manager.initialize()) {
  console.info(`使用后端: ${manager.getBackendName()}`);
} else {
  console.error('图形系统初始化失败');
}
```

### 3. 创建和使用资源

```typescript
// 创建纹理
const texture = manager.createTexture(1024, 768);
if (texture) {
  texture.bind();
  texture.uploadData(imageData);
  texture.unbind();
}

// 创建顶点缓冲区
const vertexBuffer = manager.createBuffer(BufferType.VERTEX_BUFFER, 4096);
if (vertexBuffer) {
  vertexBuffer.bind();
  vertexBuffer.uploadData(vertexData);
  vertexBuffer.unbind();
}

// 创建帧缓冲区
const framebuffer = manager.createFramebuffer(1920, 1080);
if (framebuffer) {
  framebuffer.bind();
  framebuffer.unbind();
}
```

### 4. 关闭图形系统

```typescript
manager.shutdown();
```

---

## 核心 API

### 枚举类型

#### ApiVersion
图形 API 版本枚举。

```typescript
enum ApiVersion {
  INVALID = -1,      // 无效
  OPENGL_ES_3 = 0,   // OpenGL ES 3.0
  METAL = 1,         // Apple Metal
  VULKAN = 2         // Vulkan
}
```

#### BufferType
缓冲区类型枚举。

```typescript
enum BufferType {
  VERTEX_BUFFER = 0,  // 顶点缓冲区
  INDEX_BUFFER = 1     // 索引缓冲区
}
```

### 接口定义

#### GraphicsContext
图形渲染上下文接口。

```typescript
interface GraphicsContext {
  readonly apiVersion: ApiVersion;      // API 版本
  readonly rendererName: string;        // 渲染器名称
  readonly rendererVersion: string;     // 渲染器版本

  init(apiVersion: ApiVersion): void;   // 初始化
  beginRendering(): boolean;            // 开始渲染
  endRendering(): void;                 // 结束渲染
  present(): void;                      // 呈现
  makeCurrent(): void;                  // 设为当前
  doneCurrent(): void;                 // 释放当前
}
```

#### Texture
纹理接口。

```typescript
interface Texture {
  readonly width: number;               // 宽度
  readonly height: number;              // 高度

  bind(): void;                        // 绑定
  unbind(): void;                      // 解绑
  uploadData(data: ArrayBuffer): void;  // 上传数据
}
```

#### Buffer
缓冲区接口。

```typescript
interface Buffer {
  readonly bufferType: BufferType;      // 缓冲区类型
  readonly size: number;               // 大小

  bind(): void;                        // 绑定
  unbind(): void;                      // 解绑
  uploadData(data: ArrayBuffer): void;  // 上传数据
}
```

#### Framebuffer
帧缓冲区接口。

```typescript
interface Framebuffer {
  readonly width: number;               // 宽度
  readonly height: number;             // 高度

  bind(): void;                       // 绑定
  unbind(): void;                     // 解绑
}
```

#### ResourceFactory
资源工厂接口。

```typescript
interface ResourceFactory {
  readonly apiVersion: ApiVersion;     // API 版本

  createTexture(width: number, height: number): Texture;
  createBuffer(bufferType: BufferType, size: number): Buffer;
  createFramebuffer(width: number, height: number): Framebuffer;
}
```

#### ContextFactory
上下文工厂接口。

```typescript
interface ContextFactory {
  createContext(): GraphicsContext;
  createResourceFactory(apiVersion: ApiVersion): ResourceFactory;
}
```

---

## 后端注册表

### 全局注册表

```typescript
import { backendRegistry } from './drape/BackendRegistry';
```

### 注册后端

```typescript
import { registerOpenGLBackend } from './drape/opengl/OpenGLBackend';

registerOpenGLBackend();
```

### 获取可用后端

```typescript
const backends = backendRegistry.getAvailableBackends();

for (const backend of backends) {
  console.info(`${backend.name} (优先级: ${backend.priority})`);
}
```

### 获取最佳后端

```typescript
const best = backendRegistry.getBestBackend();
if (best) {
  console.info(`最佳后端: ${best.name}`);
}
```

### 创建工厂

```typescript
const factory = backendRegistry.createDefaultFactory();
if (factory) {
  const context = factory.createContext();
  const resourceFactory = factory.createResourceFactory(ApiVersion.OPENGL_ES_3);
}
```

---

## GraphicsManager 使用

### 初始化

```typescript
const manager = new GraphicsManager();
manager.initialize();
```

### 创建纹理

```typescript
const texture = manager.createTexture(width, height);
if (texture) {
  texture.bind();
  texture.uploadData(data);
  texture.unbind();
}
```

### 创建缓冲区

```typescript
// 顶点缓冲区
const vbo = manager.createBuffer(BufferType.VERTEX_BUFFER, size);

// 索引缓冲区
const ibo = manager.createBuffer(BufferType.INDEX_BUFFER, size);
```

### 创建帧缓冲区

```typescript
const fbo = manager.createFramebuffer(width, height);
```

### 关闭

```typescript
manager.shutdown();
```

---

## 完整示例

### 基础渲染示例

```typescript
import { GraphicsManager, ApiVersion, BufferType } from './drape/BackendRegistry';
import { registerOpenGLBackend } from './drape/opengl/OpenGLBackend';

class MapRenderer {
  private manager: GraphicsManager = new GraphicsManager();
  private texture: any = null;
  private vertexBuffer: any = null;
  private running: boolean = false;

  async initialize(): Promise<void> {
    registerOpenGLBackend();

    if (!this.manager.initialize()) {
      throw new Error('Failed to initialize graphics');
    }

    this.createResources();
  }

  private createResources(): void {
    this.texture = this.manager.createTexture(1024, 1024);
    this.vertexBuffer = this.manager.createBuffer(BufferType.VERTEX_BUFFER, 1024);
  }

  start(): void {
    this.running = true;
    this.render();
  }

  stop(): void {
    this.running = false;
    this.manager.shutdown();
  }

  private render(): void {
    if (!this.running) return;

    // 获取上下文
    const context = this.manager['context'];
    if (context && context.beginRendering()) {
      // 渲染逻辑
      this.draw();

      context.endRendering();
      context.present();
    }

    // 下一帧
    setTimeout(() => this.render(), 16);
  }

  private draw(): void {
    if (this.texture) this.texture.bind();
    if (this.vertexBuffer) this.vertexBuffer.bind();

    // 绘制调用
    console.debug('Drawing...');

    if (this.vertexBuffer) this.vertexBuffer.unbind();
    if (this.texture) this.texture.unbind();
  }
}

// 使用
const renderer = new MapRenderer();
renderer.initialize().then(() => {
  renderer.start();
});
```

### 错误处理示例

```typescript
import { backendRegistry, GraphicsManager, ApiVersion } from './drape/BackendRegistry';
import { registerOpenGLBackend } from './drape/opengl/OpenGLBackend';

function safeInitialize(): boolean {
  try {
    registerOpenGLBackend();

    const manager = new GraphicsManager();
    const success = manager.initialize();

    if (!success) {
      console.warn('初始化失败，尝试回退...');

      const factory = backendRegistry.createContextFactory(ApiVersion.OPENGL_ES_3);
      if (!factory) {
        throw new Error('无可用图形后端');
      }

      console.info('回退到 OpenGL ES 3.0');
    }

    return true;
  } catch (error) {
    console.error(`错误: ${error}`);
    return false;
  }
}
```

---

## 性能考虑

### 资源重用

```typescript
// ✅ 好的做法：重用纹理
const sharedTexture = manager.createTexture(1024, 1024);
sharedTexture.bind();
sharedTexture.uploadData(data1);
sharedTexture.unbind();

// ... 使用 ...

sharedTexture.bind();
sharedTexture.uploadData(data2);
sharedTexture.unbind();
```

### 批量操作

```typescript
// ✅ 好的做法：批量绑定
texture1.bind();
buffer1.bind();
framebuffer.bind();

// 绘制

framebuffer.unbind();
buffer1.unbind();
texture1.unbind();
```

---

## 平台特定说明

### OpenGL ES 3.0
- 用于桌面和移动设备的通用图形 API
- 支持广泛，兼容性最好
- 适合跨平台应用

### Vulkan
- 用于 Android 的现代图形 API
- 提供更好的性能和更低的开销
- 需要更多的手动资源管理

### Metal
- 用于 Apple 设备的图形 API
- 在 iOS/macOS 上提供最佳性能
- 与 Apple 生态系统深度集成

---

## 调试技巧

### 检查可用后端

```typescript
import { backendRegistry } from './drape/BackendRegistry';
import { registerOpenGLBackend, registerVulkanBackend } from './drape';

registerOpenGLBackend();
registerVulkanBackend();

console.info(JSON.stringify(backendRegistry.getAvailableBackends(), null, 2));
```

### 性能分析

```typescript
const start = Date.now();
const texture = manager.createTexture(2048, 2048);
const end = Date.now();

console.info(`纹理创建耗时: ${end - start}ms`);
```

---

## 故障排除

### 初始化失败

```typescript
// 检查后端是否注册
console.info(backendRegistry.getAvailableBackends().length);

// 尝试手动创建
const factory = backendRegistry.createContextFactory(ApiVersion.OPENGL_ES_3);
if (!factory) {
  console.error('后端未注册或不支持');
}
```

### 资源创建失败

```typescript
const texture = manager.createTexture(width, height);
if (!texture) {
  // 检查内存是否足够
  // 检查参数是否有效
  console.error('纹理创建失败');
}
```

### 渲染问题

```typescript
const context = manager['context'];
if (context) {
  // 确保在正确的线程中调用
  // 检查上下文是否当前
  console.info(`API Version: ${context.apiVersion}`);
  console.info(`Renderer: ${context.rendererName}`);
}
```
