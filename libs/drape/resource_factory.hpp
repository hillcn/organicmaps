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

  // 获取 API 版本
  virtual ApiVersion GetApiVersion() const = 0;

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
