# Drape 制图模块架构分析与解耦方案

## 1. 现有架构概述

### 1.1 核心模块分层结构

```
┌─────────────────────────────────────────────────────────────┐
│            Map Framework (libs/map)                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │          Framework (主入口)                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                ↓                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Drape Frontend (libs/drape_frontend)                  │ │
│  │  - DrapeEngine                                         │ │
│  │  - RenderGroup, RenderNode                             │ │
│  │  - Shapes, Text, Route rendering                       │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         Graphics Abstraction Layer (libs/drape)             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  GraphicsContext (抽象接口)                            │ │
│  │  - OGLContext (OpenGL ES 3.0)                         │ │
│  │  - MetalContext (Apple Metal)                         │ │
│  │  - VulkanContext (Vulkan)                             │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Resource Abstraction                                 │ │
│  │  - GpuProgram                                         │ │
│  │  - Texture, Framebuffer, VertexArray                  │ │
│  │  - RenderState, Batcher                              │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         Shader Management (libs/shaders)                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ProgramManager (统一管理)                            │ │
│  │  ProgramPool (抽象接口)                               │ │
│  │  - GLProgramPool (OpenGL)                             │ │
│  │  - MetalProgramPool (Metal)                          │ │
│  │  - VulkanProgramPool (Vulkan)                         │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ProgramParams (统一参数结构)                         │ │
│  │  - MapProgramParams, RouteProgramParams, etc          │ │
│  │  ProgramParamsSetter (参数设置器)                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 当前架构优点

1. **已有的抽象层**：
   - `GraphicsContext` - 统一的渲染上下文接口
   - `ProgramPool` - 统一的着色器程序池接口
   - `GpuProgram` - 统一的GPU程序接口
   - `ProgramParams` - 统一的参数结构（GLSL/Metal/SPIR-V兼容）

2. **多后端支持框架**：
   - OpenGL ES 3.0
   - Apple Metal
   - Vulkan (Android)

3. **良好的工厂模式**：
   - `GraphicsContextFactory` - 上下文工厂
   - `ThreadSafeFactory` - 线程安全的工厂包装器

### 1.3 存在的耦合问题

#### 1.3.1 后端特定代码侵入问题

```cpp
// libs/shaders/program_manager.hpp - 问题示例
class ProgramManager
{
private:
  // ❌ 此处有直接的后端分支代码
  void InitForOpenGL(ref_ptr<dp::GraphicsContext> context);
  void InitForVulkan(ref_ptr<dp::GraphicsContext> context);
  void DestroyForVulkan(ref_ptr<dp::GraphicsContext> context);

#if defined(OMIM_METAL_AVAILABLE)
  // ❌ 平台/API特定的条件编译
  void InitForMetal(ref_ptr<dp::GraphicsContext> context);
  void DestroyForMetal(ref_ptr<dp::GraphicsContext> context);
#endif
};
```

#### 1.3.2 框架层耦合问题

```cpp
// libs/map/framework.hpp - 潜在耦合风险
class Framework
{
  // 直接依赖具体的 GraphicsContextFactory
  std::unique_ptr<dp::GraphicsContextFactory> m_graphicsContextFactory;

  // 可能在某些路径中隐含假设了特定 API
  TDrapeFunction m_drapeFunction;
};
```

#### 1.3.3 资源管理耦合问题

- 纹理、缓冲区等资源创建可能隐含假设了特定API
- 没有统一的资源注册和生命周期管理机制

---

## 2. 解耦设计方案

### 2.1 架构改进目标

#### 2.1.1 核心原则

1. **API无关的核心渲染逻辑** - 所有地图绘制代码不关心具体使用OpenGL/Metal/Vulkan
2. **可插拔的后端实现** - 后端通过统一的工厂和注册表动态加载
3. **零条件编译侵入** - 核心层代码没有`#ifdef GL/VULKAN/METAL`
4. **统一的资源抽象** - 所有资源类型通过统一接口访问

#### 2.1.2 分层职责定义

| 层级 | 职责 | API依赖 |
|------|------|---------|
| **Map Framework** | 业务逻辑、地图数据、用户交互 | **无** |
| **Drape Frontend** | 绘制调度、数据准备、形状生成 | **Graphics Abstraction** |
| **Graphics Abstraction** | 统一渲染接口 | **Backend Interface** |
| **Backend Implementation** | OpenGL/Metal/Vulkan具体实现 | **特定的图形API** |

---

### 2.2 详细设计方案

#### 2.2.1 统一图形API注册系统

```
backend_registry.hpp (新增)
└── 负责注册和管理所有可用的图形API后端
```

#### 2.2.2 增强的上下文抽象层

```
graphics_context.hpp (改进现有)
└── 完全隔离的上下文接口，不暴露任何API细节
```

#### 2.2.3 统一的资源工厂

```
resource_factory.hpp (新增)
└── 统一创建各种图形资源，不依赖特定实现
```

#### 2.2.4 完全解耦的ProgramManager

```
program_manager.hpp (重构)
└── 通过工厂/注册表动态创建后端，无条件编译
```

---

## 3. 具体实现方案

### 3.1 核心接口定义

#### 3.1.1 后端描述符和注册表

```cpp
// libs/drape/backend_registry.hpp (NEW)
#pragma once

#include "drape/drape_global.hpp"

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace dp
{
class GraphicsContext;
class GraphicsContextFactory;

struct BackendDescriptor
{
  ApiVersion m_apiVersion;
  std::string m_name;
  std::string m_description;
  int m_priority;  // 优先级，用于自动选择

  std::function<std::unique_ptr<GraphicsContext>()> m_contextCreator;
  std::function<std::unique_ptr<GraphicsContextFactory>()> m_factoryCreator;

  bool m_isSupported;
  std::function<bool()> m_supportChecker;
};

class BackendRegistry
{
public:
  static BackendRegistry & Instance();

  // 注册后端
  void RegisterBackend(BackendDescriptor descriptor);

  // 获取所有可用后端
  std::vector<BackendDescriptor> const & GetAvailableBackends() const;

  // 获取最佳后端（根据优先级和可用性）
  BackendDescriptor const * GetBestBackend() const;

  // 根据ApiVersion获取特定后端
  BackendDescriptor const * GetBackend(ApiVersion apiVersion) const;

  // 自动选择并创建上下文工厂
  std::unique_ptr<GraphicsContextFactory> CreateDefaultFactory() const;

private:
  BackendRegistry() = default;
  std::vector<BackendDescriptor> m_backends;
};

} // namespace dp
```

#### 3.1.2 增强的资源工厂

```cpp
// libs/drape/resource_factory.hpp (NEW)
#pragma once

#include "drape/pointers.hpp"
#include "drape/graphics_context.hpp"
#include "drape/texture.hpp"
#include "drape/gpu_program.hpp"
#include "drape/gpu_buffer.hpp"

#include <string>

namespace dp
{
class ResourceFactory
{
public:
  virtual ~ResourceFactory() = default;

  // 纹理相关
  virtual drape_ptr<Texture> CreateTexture(
    ref_ptr<GraphicsContext> context,
    Texture::Params const & params) = 0;

  // GPU程序相关
  virtual drape_ptr<GpuProgram> CreateProgram(
    ref_ptr<GraphicsContext> context,
    std::string_view programName) = 0;

  // 缓冲区相关
  virtual drape_ptr<GpuBuffer> CreateBuffer(
    ref_ptr<GraphicsContext> context,
    GpuBuffer::BufferType type,
    uint32_t size) = 0;

  // 渲染目标相关
  virtual drape_ptr<BaseFramebuffer> CreateFramebuffer(
    ref_ptr<GraphicsContext> context,
    uint32_t width, uint32_t height) = 0;
};

} // namespace dp
```

#### 3.1.3 重构的 ProgramManager

```cpp
// libs/shaders/program_manager.hpp (REFACTOR)
#pragma once

#include "shaders/program_params.hpp"
#include "shaders/program_pool.hpp"

#include "drape/drape_global.hpp"
#include "drape/gpu_program.hpp"
#include "drape/graphics_context.hpp"
#include "drape/pointers.hpp"
#include "drape/resource_factory.hpp" // NEW

#include "base/macros.hpp"
#include "base/thread_checker.hpp"

#include <array>
#include <string>
#include <functional>

namespace gpu
{
class ProgramManager
{
public:
  ProgramManager() = default;

  // ✅ 统一的初始化接口，无后端分支
  void Init(ref_ptr<dp::GraphicsContext> context,
            ref_ptr<dp::ResourceFactory> factory);

  void Destroy(ref_ptr<dp::GraphicsContext> context);

  ref_ptr<dp::GpuProgram> GetProgram(Program program);
  ref_ptr<ProgramParamsSetter> GetParamsSetter() const;

private:
  // ✅ 使用工厂创建，不再有特定后端分支
  std::unique_ptr<ProgramPool> m_pool;
  using Programs = std::array<drape_ptr<dp::GpuProgram>,
                              static_cast<size_t>(Program::ProgramsCount)>;
  Programs m_programs;
  drape_ptr<ProgramParamsSetter> m_paramsSetter;

  ref_ptr<dp::ResourceFactory> m_resourceFactory;

  DECLARE_THREAD_CHECKER(m_threadChecker);
  DISALLOW_COPY_AND_MOVE(ProgramManager);
};
}  // namespace gpu
```

---

### 3.2 后端实现注册示例

#### 3.2.1 OpenGL 后端注册

```cpp
// libs/drape/gl_backend_register.cpp (NEW)
#include "drape/backend_registry.hpp"
#include "drape/oglcontext.hpp"
#include "shaders/gl_program_pool.hpp"
#include "shaders/gl_program_params.hpp"

#include <string>

namespace dp
{
namespace gl_backend
{
bool IsSupported()
{
  // 检查OpenGL ES 3.0支持
  return true;
}

std::unique_ptr<GraphicsContext> CreateContext()
{
  return std::make_unique<OGLContext>();
}

std::unique_ptr<GraphicsContextFactory> CreateFactory()
{
  // 创建OpenGL专用的上下文工厂
  return std::make_unique<GLGraphicsContextFactory>();
}

void Register()
{
  BackendDescriptor desc;
  desc.m_apiVersion = ApiVersion::OpenGLES3;
  desc.m_name = "OpenGL ES 3.0";
  desc.m_description = "OpenGL ES 3.0 rendering backend";
  desc.m_priority = 50;
  desc.m_contextCreator = &CreateContext;
  desc.m_factoryCreator = &CreateFactory;
  desc.m_supportChecker = &IsSupported;
  desc.m_isSupported = IsSupported();

  BackendRegistry::Instance().RegisterBackend(std::move(desc));
}

} // namespace gl_backend
} // namespace dp

// 自动注册宏
#define REGISTER_BACKEND(BackendRegisterFn) \
  static bool backendRegistered = (BackendRegisterFn(), true);

REGISTER_BACKEND(dp::gl_backend::Register)
```

#### 3.2.2 Metal 后端注册

```cpp
// libs/drape/metal_backend_register.mm (NEW)
#import "drape/backend_registry.hpp"

#if defined(OMIM_METAL_AVAILABLE)

namespace dp
{
namespace metal_backend
{
// Metal 特定的实现...

void Register()
{
  BackendDescriptor desc;
  desc.m_apiVersion = ApiVersion::Metal;
  desc.m_name = "Apple Metal";
  desc.m_priority = 100;  // 最高优先级
  // ... 其他设置

  BackendRegistry::Instance().RegisterBackend(std::move(desc));
}

} // namespace metal_backend
} // namespace dp

REGISTER_BACKEND(dp::metal_backend::Register)

#endif // OMIM_METAL_AVAILABLE
```

---

### 3.3 Framework 层解耦示例

#### 3.3.1 改进的 Framework 初始化

```cpp
// libs/map/framework.hpp (REFACTOR)
#pragma once

#include "drape/drape_global.hpp"
#include "drape/graphics_context_factory.hpp"
#include "drape/backend_registry.hpp"

// ... 其他 include

class Framework
{
public:
  Framework()
  {
    // ✅ 通过注册表自动选择最佳后端
    m_graphicsContextFactory = dp::BackendRegistry::Instance()
                                .CreateDefaultFactory();
  }

  // 允许显式选择特定后端
  explicit Framework(dp::ApiVersion apiVersion)
  {
    auto const * desc = dp::BackendRegistry::Instance().GetBackend(apiVersion);
    if (desc && desc->m_factoryCreator)
      m_graphicsContextFactory = desc->m_factoryCreator();
  }

  // ... 其他成员

private:
  std::unique_ptr<dp::GraphicsContextFactory> m_graphicsContextFactory;

  // ✅ 不再有 API 特定的条件编译或分支
  // 所有后端特定细节封装在各自的实现中
};
```

---

## 4. 文件组织和依赖关系

### 4.1 推荐的目录结构

```
libs/
├── drape/
│   ├── core/                    # 核心抽象（无后端依赖）
│   │   ├── graphics_context.hpp
│   │   ├── resource_factory.hpp
│   │   ├── gpu_program.hpp
│   │   ├── texture.hpp
│   │   └── gpu_buffer.hpp
│   ├── backend_registry.hpp    # 后端注册表（新增）
│   ├── gl/                     # OpenGL 专用实现
│   │   ├── gl_context.hpp/cpp
│   │   ├── gl_resource_factory.hpp/cpp
│   │   └── gl_backend_register.cpp
│   ├── metal/                  # Metal 专用实现
│   │   ├── metal_context.hpp/mm
│   │   ├── metal_resource_factory.hpp/mm
│   │   └── metal_backend_register.mm
│   ├── vulkan/                 # Vulkan 专用实现
│   │   ├── vulkan_context.hpp/cpp
│   │   ├── vulkan_resource_factory.hpp/cpp
│   │   └── vulkan_backend_register.cpp
│   └── [其他现有文件...]
├── shaders/
│   ├── core/                    # 核心管理（无后端依赖）
│   │   ├── program_manager.hpp/cpp
│   │   ├── program_pool.hpp
│   │   └── program_params.hpp
│   ├── gl/                     # GLSL 程序
│   │   ├── gl_program_pool.hpp/cpp
│   │   └── gl_program_params.hpp/cpp
│   ├── metal/                  # Metal 程序
│   │   ├── metal_program_pool.hpp/mm
│   │   └── metal_program_params.hpp/mm
│   └── vulkan/                 # SPIR-V 程序
│       ├── vulkan_program_pool.hpp/cpp
│       └── vulkan_program_params.hpp/cpp
└── map/
    └── framework.hpp/cpp       # 业务逻辑（无特定API依赖）
```

### 4.2 依赖规则

1. **核心层 -> 无任何后端依赖**
   - `drape/core/` 只包含接口定义
   - `shaders/core/` 只包含统一的管理逻辑

2. **后端实现层 -> 核心层 + 特定图形API**
   - `drape/gl/` 可以依赖 OpenGL 库
   - `drape/metal/` 可以依赖 Metal 库
   - `drape/vulkan/` 可以依赖 Vulkan 库

3. **业务逻辑层 -> 核心抽象层**
   - `map/framework` 只依赖 `graphics_context.hpp` 等接口
   - 不包含任何 API 特定的条件编译

---

## 5. 迁移步骤

### 5.1 阶段 1: 建立注册表和工厂系统

1. 创建 `backend_registry.hpp/cpp`
2. 创建 `resource_factory.hpp` 接口
3. 重构 `program_manager.hpp` 移除条件编译

### 5.2 阶段 2: 逐步迁移现有后端

1. 将 `OGLContext` 移到 `drape/gl/` 目录
2. 创建 `GLResourceFactory` 实现
3. 创建 OpenGL 后端注册
4. 对 Metal 和 Vulkan 做同样处理

### 5.3 阶段 3: 清理上层逻辑

1. 移除 `map/framework.hpp` 中的 API 特定假设
2. 移除 `drape_frontend/` 中的条件编译
3. 清理所有 `#ifdef OMIM_METAL_AVAILABLE` 等代码

### 5.4 阶段 4: 测试和验证

1. 确保所有后端都能正常工作
2. 确保自动选择机制正确
3. 性能测试没有明显下降

---

## 6. 总结

### 6.1 解耦优势

| 方面 | 解耦前 | 解耦后 |
|------|--------|--------|
| **代码清晰度** | 条件编译散布各处 | 单一的注册表 |
| **可测试性** | 难以mock特定API | 容易mock接口 |
| **可扩展性** | 修改核心代码才能加新后端 | 只需注册新后端 |
| **跨平台** | 复杂的条件编译树 | 统一的自动选择 |
| **维护成本** | 高耦合变更风险大 | 各后端独立演进 |

### 6.2 保持不变的部分

- 现有的 `GraphicsContext` 接口设计是优秀的
- 统一的 `ProgramParams` 结构设计非常好
- `DrapeEngine` 等逻辑已经很好地隔离了
