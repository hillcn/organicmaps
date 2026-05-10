#pragma once

#include "drape/resource_factory.hpp"
#include "drape/oglcontext.hpp"
#include "drape/texture.hpp"
#include "drape/gpu_program.hpp"

#include <memory>

namespace dp
{
namespace gl
{
class GLResourceFactory : public ResourceFactory
{
public:
  ApiVersion GetApiVersion() const override;

  drape_ptr<Texture> CreateTexture(
    ref_ptr<GraphicsContext> context,
    Texture::Params const & params) override;

  drape_ptr<GpuProgram> CreateProgram(
    ref_ptr<GraphicsContext> context,
    std::string_view programName) override;

  drape_ptr<GpuBuffer> CreateBuffer(
    ref_ptr<GraphicsContext> context,
    GpuBuffer::BufferType type,
    uint32_t size) override;

  drape_ptr<BaseFramebuffer> CreateFramebuffer(
    ref_ptr<GraphicsContext> context,
    uint32_t width, uint32_t height) override;
};

} // namespace gl
} // namespace dp
