#include "drape/gl/gl_resource_factory.hpp"
#include "drape/gl_includes.hpp"
#include "drape/texture.hpp"

namespace dp
{
namespace gl
{

ApiVersion GLResourceFactory::GetApiVersion() const
{
  return ApiVersion::OpenGLES3;
}

drape_ptr<Texture> GLResourceFactory::CreateTexture(
  ref_ptr<GraphicsContext> context,
  Texture::Params const & params)
{
  // 实际的OpenGL纹理创建逻辑
  return nullptr; // 这里应该是具体实现
}

drape_ptr<GpuProgram> GLResourceFactory::CreateProgram(
  ref_ptr<GraphicsContext> context,
  std::string_view programName)
{
  // 实际的GPU程序创建逻辑
  return nullptr; // 这里应该是具体实现
}

drape_ptr<GpuBuffer> GLResourceFactory::CreateBuffer(
  ref_ptr<GraphicsContext> context,
  GpuBuffer::BufferType type,
  uint32_t size)
{
  // 实际的GPU缓冲区创建逻辑
  return nullptr; // 这里应该是具体实现
}

drape_ptr<BaseFramebuffer> GLResourceFactory::CreateFramebuffer(
  ref_ptr<GraphicsContext> context,
  uint32_t width, uint32_t height)
{
  // 实际的帧缓冲区创建逻辑
  return nullptr; // 这里应该是具体实现
}

} // namespace gl
} // namespace dp
