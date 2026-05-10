#include "drape/backend_registry.hpp"
#include "drape/graphics_context_factory.hpp"

#include <algorithm>

namespace dp
{
BackendRegistry & BackendRegistry::Instance()
{
  static BackendRegistry instance;
  return instance;
}

void BackendRegistry::RegisterBackend(BackendDescriptor descriptor)
{
  std::lock_guard<std::mutex> lock(m_mutex);
  m_backends.push_back(std::move(descriptor));

  // 按优先级排序
  std::sort(m_backends.begin(), m_backends.end(),
            [](BackendDescriptor const & a, BackendDescriptor const & b)
            {
              return a.m_priority > b.m_priority;
            });
}

std::vector<BackendDescriptor> const & BackendRegistry::GetAvailableBackends() const
{
  std::lock_guard<std::mutex> lock(m_mutex);
  return m_backends;
}

BackendDescriptor const * BackendRegistry::GetBestBackend() const
{
  std::lock_guard<std::mutex> lock(m_mutex);
  for (auto const & desc : m_backends)
  {
    if (desc.m_isSupported &&
        (!desc.m_supportChecker || desc.m_supportChecker()))
    {
      return &desc;
    }
  }
  return nullptr;
}

BackendDescriptor const * BackendRegistry::GetBackend(ApiVersion apiVersion) const
{
  std::lock_guard<std::mutex> lock(m_mutex);
  for (auto const & desc : m_backends)
  {
    if (desc.m_apiVersion == apiVersion)
    {
      if (!desc.m_supportChecker || desc.m_supportChecker())
        return &desc;
    }
  }
  return nullptr;
}

std::unique_ptr<GraphicsContextFactory> BackendRegistry::CreateDefaultFactory() const
{
  auto const * best = GetBestBackend();
  if (best && best->m_factoryCreator)
    return best->m_factoryCreator();

  return nullptr;
}

std::unique_ptr<ResourceFactory> BackendRegistry::CreateResourceFactory(ApiVersion apiVersion) const
{
  auto const * desc = GetBackend(apiVersion);
  if (desc && desc->m_resourceFactoryCreator)
    return desc->m_resourceFactoryCreator();

  return nullptr;
}

std::unique_ptr<ResourceFactory> BackendRegistry::CreateDefaultResourceFactory() const
{
  auto const * best = GetBestBackend();
  if (best && best->m_resourceFactoryCreator)
    return best->m_resourceFactoryCreator();

  return nullptr;
}

} // namespace dp
