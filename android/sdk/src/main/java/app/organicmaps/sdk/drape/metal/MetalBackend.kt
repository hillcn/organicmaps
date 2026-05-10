package app.organicmaps.sdk.drape.metal

import app.organicmaps.sdk.drape.*

class MetalGraphicsContext : GraphicsContext {
    private var initialized = false

    override val apiVersion: ApiVersion
        get() = ApiVersion.METAL

    override val rendererName: String
        get() = "Metal"

    override val rendererVersion: String
        get() = "1.0"

    override fun init(apiVersion: ApiVersion) {
        this.initialized = true
    }

    override fun beginRendering(): Boolean {
        return initialized
    }

    override fun endRendering() {
        // Metal end rendering code
    }

    override fun present() {
        // Metal present code
    }

    override fun makeCurrent() {
        // Metal make current code
    }

    override fun doneCurrent() {
        // Metal done current code
    }
}

class MetalTexture(
    override val width: Int,
    override val height: Int
) : Texture {
    init {
        // Metal texture creation code
    }

    override fun bind() {
        // Metal bind code
    }

    override fun unbind() {
        // Metal unbind code
    }
}

class MetalBuffer(
    override val bufferType: BufferType,
    override val size: Int
) : Buffer {
    init {
        // Metal buffer creation code
    }

    override fun bind() {
        // Metal bind code
    }

    override fun unbind() {
        // Metal unbind code
    }

    override fun uploadData(data: ByteArray) {
        // Metal upload code
    }
}

class MetalFramebuffer(
    override val width: Int,
    override val height: Int
) : Framebuffer {
    init {
        // Metal framebuffer creation code
    }

    override fun bind() {
        // Metal bind code
    }

    override fun unbind() {
        // Metal unbind code
    }
}

class MetalResourceFactory : ResourceFactory {
    override val apiVersion: ApiVersion
        get() = ApiVersion.METAL

    override fun createTexture(width: Int, height: Int): Texture {
        return MetalTexture(width, height)
    }

    override fun createBuffer(bufferType: BufferType, size: Int): Buffer {
        return MetalBuffer(bufferType, size)
    }

    override fun createFramebuffer(width: Int, height: Int): Framebuffer {
        return MetalFramebuffer(width, height)
    }
}

class MetalContextFactory : ContextFactory {
    override fun createContext(): GraphicsContext {
        return MetalGraphicsContext()
    }

    override fun createResourceFactory(apiVersion: ApiVersion): ResourceFactory {
        return MetalResourceFactory()
    }
}
