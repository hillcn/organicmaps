#pragma once

#include "drape/drape_global.hpp"

#include <functional>
#include <memory>
#include <string>
#include <vector>
#include <mutex>

namespace dp
{
class GraphicsContext;
class GraphicsContextFactory;

struct BackendDescriptor
{
  ApiVersion m_apiVersion = ApiVersion::Invalid;
  std::string m_name;
  std::string m_description;
  int m_priority = 0;  // 优先级，用于自动选择

  std::function<std::unique_ptr<GraphicsContext>()> m_contextCreator;
  std::function<std::unique_ptr<GraphicsContextFactory>()> m_factoryCreator;
  std::function<std::unique_ptr<class ResourceFactory>()> m_resourceFactoryCreator;

  bool m_isSupported = false;
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

  // 创建指定后端的资源工厂
  std::unique_ptr<class ResourceFactory> CreateResourceFactory(ApiVersion apiVersion) const;

  // 创建最佳后端的资源工厂
  std::unique_ptr<class ResourceFactory> CreateDefaultResourceFactory() const;

private:
  BackendRegistry() = default;
  std::vector<BackendDescriptor> m_backends;
  mutable std::mutex m_mutex;
};

} // namespace dp
