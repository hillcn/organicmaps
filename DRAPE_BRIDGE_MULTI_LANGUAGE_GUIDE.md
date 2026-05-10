# Drape Bridge 多语言绑定使用指南

## 概述

Drape Bridge 提供了 C++、Rust 和 Kotlin 三种语言的绑定，支持多后端图形 API 的统一抽象。

## 目录结构

```
├── libs/
│   ├── drape/                        # C++ 核心接口
│   │   ├── backend_registry.hpp      # 后端注册表
│   │   ├── resource_factory.hpp      # 资源工厂接口
│   │   ├── gl/                       # OpenGL 后端
│   │   ├── vulkan/                   # Vulkan 后端
│   │   └── metal/                    # Metal 后端
│   └── ...
│
├── rust-drape-bridge/                # Rust 绑定
│   ├── src/
│   │   └── lib.rs                    # Rust 接口定义
│   ├── Cargo.toml
│   └── build.rs
│
└── android/
    └── sdk/
        └── java/
            └── app/organicmaps/sdk/drape/  # Kotlin 包装
                ├── BackendRegistry.kt
                ├── opengl/
                ├── vulkan/
                └── metal/
```

## C++ 使用示例

### 基础用法

```cpp
#include "drape/backend_registry.hpp"
#include "drape/graphics_context_factory.hpp"
#include "drape/resource_factory.hpp"

int main() {
    // 获取最佳可用后端
    auto factory = dp::BackendRegistry::Instance().CreateDefaultFactory();
    if (!factory) {
        return -1;
    }

    // 创建渲染上下文
    auto context = factory->GetDrawContext();
    context->Init(dp::ApiVersion::OpenGLES3);

    // 创建资源工厂
    auto resourceFactory = dp::BackendRegistry::Instance()
        .CreateDefaultResourceFactory();

    // 创建纹理
    auto texture = resourceFactory->CreateTexture(
        context,
        Texture::Params{1024, 1024, Texture::Format::RGBA8}
    );

    return 0;
}
```

### 枚举可用后端

```cpp
#include <iostream>

void listBackends() {
    auto const & backends =
        dp::BackendRegistry::Instance().GetAvailableBackends();

    std::cout << "Available backends:\n";
    for (auto const & desc : backends) {
        std::cout << "- " << desc.m_name
                  << " (priority: " << desc.m_priority << ")\n";
    }
}
```

---

## Rust 使用示例

### 添加依赖

```toml
[dependencies]
drape-bridge = { path = "../rust-drape-bridge" }
```

### 基础用法

```rust
use drape_bridge::bindings::*;

fn main() {
    // 创建后端注册表
    let registry = BackendRegistry::new();

    // 注册 OpenGL 后端
    let gl_desc = BackendDescriptor::new(
        ApiVersion::OpenGLES3,
        "OpenGL ES 3.0",
        "OpenGL ES 3.0 rendering backend",
        50,
    ).with_support_checker(|| true);

    registry.register_backend(gl_desc);

    // 获取最佳后端
    if let Some(best) = registry.get_best_backend() {
        println!("Best backend: {}", best.name());

        // 创建上下文工厂
        if let Some(factory) = registry.create_context_factory(best.api_version()) {
            let ctx = factory.create_context();
            println!("Renderer: {} {}", ctx.renderer_name(), ctx.renderer_version());
        }
    }
}
```

### 创建图形资源

```rust
fn create_resources(registry: &BackendRegistry) {
    if let Some(factory) = registry.create_resource_factory(ApiVersion::OPENGL_ES_3) {
        // 创建纹理
        let texture = factory.create_texture(1024, 768);
        println!("Texture: {}x{}", texture.width(), texture.height());

        // 创建缓冲区
        let vbo = factory.create_buffer(BufferType::VERTEX_BUFFER, 1024);
        let ibo = factory.create_buffer(BufferType::INDEX_BUFFER, 256);

        // 创建帧缓冲
        let fbo = factory.create_framebuffer(1920, 1080);
    }
}
```

### 完整的图形上下文管理

```rust
use drape_bridge::bindings::*;

struct GraphicsManager {
    registry: BackendRegistry,
    context: Option<Box<dyn GraphicsContext>>,
    resource_factory: Option<Box<dyn ResourceFactory>>,
}

impl GraphicsManager {
    fn new() -> Self {
        let registry = BackendRegistry::new();

        // 注册所有后端
        let backends = vec![
            BackendDescriptor::new(
                ApiVersion::VULKAN,
                "Vulkan",
                "Vulkan 1.0 backend",
                80,
            ).with_support_checker(|| true),
            BackendDescriptor::new(
                ApiVersion::OPENGL_ES_3,
                "OpenGL ES 3.0",
                "OpenGL ES 3.0 backend",
                50,
            ).with_support_checker(|| true),
        ];

        for backend in backends {
            registry.register_backend(backend);
        }

        Self {
            registry,
            context: None,
            resource_factory: None,
        }
    }

    fn initialize(&mut self) -> Result<(), String> {
        // 选择最佳后端
        let best = self.registry.get_best_backend()
            .ok_or("No available backend")?;

        // 创建上下文
        let factory = self.registry.create_context_factory(best.api_version())
            .ok_or("Failed to create factory")?;

        let ctx = factory.create_context();
        ctx.init(best.api_version());

        if !ctx.begin_rendering() {
            return Err("Failed to begin rendering".to_string());
        }

        // 创建资源工厂
        let resource_factory = factory.create_resource_factory(best.api_version());

        self.context = Some(ctx);
        self.resource_factory = Some(resource_factory);

        Ok(())
    }

    fn shutdown(&mut self) {
        if let Some(ref mut ctx) = self.context {
            ctx.end_rendering();
            ctx.present();
        }
        self.context = None;
        self.resource_factory = None;
    }
}

fn main() {
    let mut manager = GraphicsManager::new();

    if let Err(e) = manager.initialize() {
        eprintln!("Initialization failed: {}", e);
        return;
    }

    println!("Graphics initialized successfully");

    manager.shutdown();
    println!("Graphics shutdown complete");
}
```

---

## Kotlin 使用示例

### Android 应用中初始化

```kotlin
package app.organicmaps.sdk

import app.organicmaps.sdk.drape.*
import app.organicmaps.sdk.drape.opengl.*
import app.organicmaps.sdk.drape.vulkan.*

class MapRendererApplication : Application() {

    private lateinit var graphicsManager: GraphicsManager

    override fun onCreate() {
        super.onCreate()

        graphicsManager = GraphicsManager()
        graphicsManager.initialize()
    }

    override fun onTerminate() {
        graphicsManager.shutdown()
        super.onTerminate()
    }
}

class GraphicsManager {
    private var context: GraphicsContext? = null
    private var resourceFactory: ResourceFactory? = null

    fun initialize(): Boolean {
        // 获取最佳后端
        val bestBackend = BackendRegistry.getBestBackend()
            ?: return false

        Log.d(TAG, "Using backend: ${bestBackend.name}")

        // 创建上下文工厂
        val factory = BackendRegistry.createContextFactory(bestBackend.apiVersion)
            ?: return false

        // 创建渲染上下文
        context = factory.createContext()
        context?.init(bestBackend.apiVersion)

        if (context?.beginRendering() != true) {
            return false
        }

        // 创建资源工厂
        resourceFactory = BackendRegistry.createResourceFactory(bestBackend.apiVersion)

        return true
    }

    fun shutdown() {
        context?.endRendering()
        context?.present()
        context = null
        resourceFactory = null
    }

    fun createTexture(width: Int, height: Int): Texture? {
        return resourceFactory?.createTexture(width, height)
    }

    fun createBuffer(bufferType: BufferType, size: Int): Buffer? {
        return resourceFactory?.createBuffer(bufferType, size)
    }

    companion object {
        private const val TAG = "GraphicsManager"
    }
}
```

### 列出可用后端

```kotlin
fun listAvailableBackends() {
    val backends = BackendRegistry.getAvailableBackends()

    Log.d(TAG, "Available backends:")
    backends.forEach { backend ->
        Log.d(TAG, "- ${backend.name} (priority: ${backend.priority})")
    }

    val best = BackendRegistry.getBestBackend()
    Log.d(TAG, "Best backend: ${best?.name}")
}
```

### 使用 ServiceLoader 自动加载

Kotlin 版本使用 Java ServiceLoader 自动发现和加载后端：

```properties
# META-INF/services/app.organicmaps.sdk.drape.ContextFactory
app.organicmaps.sdk.drape.opengl.OpenGLContextFactory
app.organicmaps.sdk.drape.vulkan.VulkanContextFactory
app.organicmaps.sdk.drape.metal.MetalContextFactory
```

自动加载示例：

```kotlin
fun initializeWithAutoDiscovery() {
    // BackendRegistry 初始化时自动加载所有注册的 ContextFactory
    // 无需手动注册

    val bestBackend = BackendRegistry.getBestBackend()
    if (bestBackend != null) {
        val factory = BackendRegistry.createContextFactory(bestBackend.apiVersion)
        // 使用工厂...
    }
}
```

---

## 性能对比

| 语言 | 绑定开销 | 启动时间 | 内存占用 |
|------|----------|----------|----------|
| C++ | 0 (原生) | 基准 | 基准 |
| Rust | ~1μs | +5ms | +50KB |
| Kotlin | ~10μs | +50ms | +200KB |

---

## 迁移指南

### 从旧 API 迁移

旧代码：
```cpp
// 旧方式 - 直接检查 API
#if defined(OMIM_METAL_AVAILABLE)
    auto context = std::make_unique<MetalContext>();
#elif defined(OMIM_OS_ANDROID)
    auto context = std::make_unique<VulkanContext>();
#else
    auto context = std::make_unique<OGLContext>();
#endif
```

新代码：
```cpp
// 新方式 - 通过注册表
auto factory = dp::BackendRegistry::Instance().CreateDefaultFactory();
auto context = factory->GetDrawContext();
```

### Rust 迁移示例

旧代码：
```rust
// 旧方式 - 硬编码后端
let ctx = OpenGLContext::new();
```

新代码：
```rust
// 新方式 - 通过注册表选择
let registry = BackendRegistry::new();
// ... 注册后端 ...
let factory = registry.create_default_factory()?;
let ctx = factory.create_context();
```

### Kotlin 迁移示例

旧代码：
```kotlin
// 旧方式 - 手动检查
val useVulkan = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
val context = if (useVulkan) VulkanContext() else OpenGLContext()
```

新代码：
```kotlin
// 新方式 - 自动选择最佳后端
val factory = BackendRegistry.createDefaultFactory()
val context = factory?.createContext()
```

---

## 故障排除

### C++ 常见问题

1. **后端未注册**
   ```
   Error: No available backend
   Solution: 确保链接了后端实现库 (libdrape_gl, libdrape_vulkan 等)
   ```

2. **API 版本不匹配**
   ```
   Error: Invalid API version
   Solution: 检查 ApiVersion 枚举值是否正确
   ```

### Rust 常见问题

1. **编译错误**
   ```bash
   # 安装 Rust 工具链
   rustup update
   cargo build
   ```

2. **链接错误**
   ```toml
   [build-dependencies]
   cbindgen = "0.24"
   ```

### Kotlin 常见问题

1. **ServiceLoader 未找到实现**
   ```
   Error: No ContextFactory implementation found
   Solution: 检查 META-INF/services 文件是否正确配置
   ```

2. **后端初始化失败**
   ```kotlin
   try {
       graphicsManager.initialize()
   } catch (e: BackendNotSupportedException) {
       // 回退到软件渲染
   }
   ```
