# Drape 解耦架构使用示例

## 快速入门

### 1. 初始化后端系统

```cpp
#include "drape/backend_registry.hpp"
#include "drape/graphics_context_factory.hpp"

// 所有后端会在链接时自动注册，无需手动初始化
// 只需在使用时获取即可
```

### 2. 自动选择最佳后端

```cpp
#include "drape/backend_registry.hpp"

// 自动选择最佳可用后端
auto contextFactory = dp::BackendRegistry::Instance().CreateDefaultFactory();

// 或者指定特定后端
auto vulkanContextFactory = dp::BackendRegistry::Instance()
    .CreateResourceFactory(dp::ApiVersion::Vulkan);
```

### 3. 在 Framework 中使用

```cpp
#include "map/framework.hpp"
#include "drape/backend_registry.hpp"

class MyFramework : public Framework
{
public:
  MyFramework()
  {
    // 使用自动选择的后端
    m_graphicsContextFactory = dp::BackendRegistry::Instance().CreateDefaultFactory();
    m_resourceFactory = dp::BackendRegistry::Instance().CreateDefaultResourceFactory();
  }

private:
  std::unique_ptr<dp::GraphicsContextFactory> m_graphicsContextFactory;
  std::unique_ptr<dp::ResourceFactory> m_resourceFactory;
};
```

### 4. 检查可用后端

```cpp
#include <iostream>
#include "drape/backend_registry.hpp"

void ListAvailableBackends()
{
  auto const & backends = dp::BackendRegistry::Instance().GetAvailableBackends();

  std::cout << "Available backends:\n";
  for (auto const & desc : backends)
  {
    std::cout << "- " << desc.m_name
              << " (priority: " << desc.m_priority << ")\n";
  }
}
```

## 创建新的后端

### 步骤 1: 实现接口

```cpp
// 在 libs/drape/mybackend/my_backend.hpp
#pragma once

#include "drape/graphics_context.hpp"

namespace dp
{
namespace mybackend
{
class MyBackendContext : public GraphicsContext
{
public:
  void Init(ApiVersion apiVersion) override
  {
    // 你的初始化代码
  }

  ApiVersion GetApiVersion() const override
  {
    return ApiVersion::MyCustomApi; // 记得在 drape_global.hpp 添加
  }

  // ... 实现其他 GraphicsContext 接口
};
} // namespace mybackend
} // namespace dp
```

### 步骤 2: 实现 ResourceFactory

```cpp
// 在 libs/drape/mybackend/my_resource_factory.hpp
#pragma once

#include "drape/resource_factory.hpp"

namespace dp
{
namespace mybackend
{
class MyBackendResourceFactory : public ResourceFactory
{
public:
  ApiVersion GetApiVersion() const override;

  drape_ptr<Texture> CreateTexture(
    ref_ptr<GraphicsContext> context,
    Texture::Params const & params) override;

  // ... 实现其他接口
};
} // namespace mybackend
} // namespace dp
```

### 步骤 3: 注册后端

```cpp
// 在 libs/drape/mybackend/mybackend_register.cpp
#include "drape/backend_registry.hpp"

namespace dp
{
namespace mybackend
{

void Register()
{
  BackendDescriptor desc;
  desc.m_apiVersion = ApiVersion::MyCustomApi;
  desc.m_name = "My Awesome Backend";
  desc.m_priority = 100;

  desc.m_supportChecker = []() -> bool {
    // 检查是否支持你的后端
    return true;
  };

  desc.m_contextCreator = []() -> std::unique_ptr<GraphicsContext> {
    return std::make_unique<MyBackendContext>();
  };

  desc.m_factoryCreator = []() -> std::unique_ptr<GraphicsContextFactory> {
    // 创建你的 ContextFactory
    return std::make_unique<MyBackendContextFactory>();
  };

  desc.m_resourceFactoryCreator = []() -> std::unique_ptr<ResourceFactory> {
    return std::make_unique<MyBackendResourceFactory>();
  };

  desc.m_isSupported = desc.m_supportChecker();

  BackendRegistry::Instance().RegisterBackend(std::move(desc));
}

} // namespace mybackend
} // namespace dp

// 自动注册
#define REGISTER_BACKEND(BackendRegisterFn) \
  static bool backendRegistered = (BackendRegisterFn(), true);

REGISTER_BACKEND(dp::mybackend::Register)
```

## 文件结构

```
libs/
├── drape/
│   ├── backend_registry.hpp          # 后端注册表
│   ├── backend_registry.cpp
│   ├── resource_factory.hpp          # 资源工厂接口
│   ├── gl/                           # OpenGL 后端
│   │   ├── gl_resource_factory.hpp
│   │   ├── gl_resource_factory.cpp
│   │   └── gl_backend_register.cpp
│   ├── metal/                        # Metal 后端
│   │   └── ...
│   └── vulkan/                       # Vulkan 后端
│       └── ...
└── map/
    └── framework.hpp/cpp             # 完全解耦的 Framework
```

## 优势

1. **零条件编译** - 核心层代码没有 `#ifdef`，更清晰易读
2. **易于测试** - 可以轻松 mock 不同的后端接口
3. **动态加载** - 后端可以作为插件动态加载（如果需要）
4. **统一管理** - 所有后端通过单一入口点管理
