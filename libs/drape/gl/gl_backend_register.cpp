#include "drape/backend_registry.hpp"
#include "drape/gl/gl_resource_factory.hpp"
#include "drape/oglcontext.hpp"

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
  // OpenGL专用的上下文工厂（这里用一个简单的实现作为示例）
  class SimpleGLContextFactory : public GraphicsContextFactory
  {
  public:
    GraphicsContext * GetDrawContext() override
    {
      static SimpleGLContext ctx;
      return &ctx;
    }

    GraphicsContext * GetResourcesUploadContext() override
    {
      return GetDrawContext();
    }

  private:
    struct SimpleGLContext : public OGLContext {};
  };

  return std::make_unique<SimpleGLContextFactory>();
}

std::unique_ptr<ResourceFactory> CreateResourceFactory()
{
  return std::make_unique<gl::GLResourceFactory>();
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
  desc.m_resourceFactoryCreator = &CreateResourceFactory;
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
