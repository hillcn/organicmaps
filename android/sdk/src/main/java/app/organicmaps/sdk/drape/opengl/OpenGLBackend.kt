package app.organicmaps.sdk.drape.opengl

import app.organicmaps.sdk.drape.*

class OpenGLGraphicsContext : GraphicsContext {
    private var initialized = false

    override val apiVersion: ApiVersion
        get() = ApiVersion.OPENGL_ES_3

    override val rendererName: String
        get() = "OpenGL ES 3.0"

    override val rendererVersion: String
        get() = "3.0"

    override fun init(apiVersion: ApiVersion) {
        this.initialized = true
    }

    override fun beginRendering(): Boolean {
        return initialized
    }

    override fun endRendering() {
        // OpenGL end rendering code
    }

    override fun present() {
        // OpenGL present code
    }

    override fun makeCurrent() {
        // OpenGL make current code
    }

    override fun doneCurrent() {
        // OpenGL done current code
    }
}

class OpenGLTexture(
    override val width: Int,
    override val height: Int
) : Texture {
    private var textureId: Int = 0

    init {
        // OpenGL texture creation code
    }

    override fun bind() {
        // OpenGL bind code
    }

    override fun unbind() {
        // OpenGL unbind code
    }
}

class OpenGLBuffer(
    override val bufferType: BufferType,
    override val size: Int
) : Buffer {
    private var bufferId: Int = 0

    init {
        // OpenGL buffer creation code
    }

    override fun bind() {
        // OpenGL bind code
    }

    override fun unbind() {
        // OpenGL unbind code
    }

    override fun uploadData(data: ByteArray) {
        // OpenGL upload code
    }
}

class OpenGLFramebuffer(
    override val width: Int,
    override val height: Int
) : Framebuffer {
    private var framebufferId: Int = 0

    init {
        // OpenGL framebuffer creation code
    }

    override fun bind() {
        // OpenGL bind code
    }

    override fun unbind() {
        // OpenGL unbind code
    }
}

class OpenGLResourceFactory : ResourceFactory {
    override val apiVersion: ApiVersion
        get() = ApiVersion.OPENGL_ES_3

    override fun createTexture(width: Int, height: Int): Texture {
        return OpenGLTexture(width, height)
    }

    override fun createBuffer(bufferType: BufferType, size: Int): Buffer {
        return OpenGLBuffer(bufferType, size)
    }

    override fun createFramebuffer(width: Int, height: Int): Framebuffer {
        return OpenGLFramebuffer(width, height)
    }
}

class OpenGLContextFactory : ContextFactory {
    override fun createContext(): GraphicsContext {
        return OpenGLGraphicsContext()
    }

    override fun createResourceFactory(apiVersion: ApiVersion): ResourceFactory {
        return OpenGLResourceFactory()
    }
}
