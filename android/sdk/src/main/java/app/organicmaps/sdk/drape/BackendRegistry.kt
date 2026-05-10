package app.organicmaps.sdk.drape

import java.util.ServiceLoader

enum class ApiVersion(val value: Int) {
    INVALID(-1),
    OPENGL_ES_3(0),
    METAL(1),
    VULKAN(2);

    companion object {
        fun fromValue(value: Int): ApiVersion {
            return entries.find { it.value == value } ?: INVALID
        }
    }
}

enum class BufferType(val value: Int) {
    VERTEX_BUFFER(0),
    INDEX_BUFFER(1);

    companion object {
        fun fromValue(value: Int): BufferType {
            return entries.find { it.value == value } ?: VERTEX_BUFFER
        }
    }
}

data class BackendDescriptor(
    val apiVersion: ApiVersion,
    val name: String,
    val description: String,
    val priority: Int,
    val isSupported: Boolean
)

interface GraphicsContext {
    val apiVersion: ApiVersion
    val rendererName: String
    val rendererVersion: String

    fun init(apiVersion: ApiVersion)
    fun beginRendering(): Boolean
    fun endRendering()
    fun present()
    fun makeCurrent()
    fun doneCurrent()
}

interface Texture {
    val width: Int
    val height: Int

    fun bind()
    fun unbind()
}

interface Buffer {
    val bufferType: BufferType
    val size: Int

    fun bind()
    fun unbind()
    fun uploadData(data: ByteArray)
}

interface Framebuffer {
    val width: Int
    val height: Int

    fun bind()
    fun unbind()
}

interface ResourceFactory {
    val apiVersion: ApiVersion

    fun createTexture(width: Int, height: Int): Texture
    fun createBuffer(bufferType: BufferType, size: Int): Buffer
    fun createFramebuffer(width: Int, height: Int): Framebuffer
}

interface ContextFactory {
    fun createContext(): GraphicsContext
    fun createResourceFactory(apiVersion: ApiVersion): ResourceFactory
}

object BackendRegistry {
    private val factories = mutableListOf<ContextFactory>()

    init {
        loadBackends()
    }

    private fun loadBackends() {
        val serviceLoader = ServiceLoader.load(ContextFactory::class.java)
        serviceLoader.forEach { factory ->
            factories.add(factory)
        }
    }

    fun registerBackend(factory: ContextFactory) {
        factories.add(factory)
    }

    fun getAvailableBackends(): List<BackendDescriptor> {
        return factories.map { factory ->
            val context = factory.createContext()
            BackendDescriptor(
                apiVersion = context.apiVersion,
                name = context.rendererName,
                description = "${context.rendererName} Backend",
                priority = getPriorityForApi(context.apiVersion),
                isSupported = true
            )
        }
    }

    fun getBestBackend(): BackendDescriptor? {
        return getAvailableBackends()
            .filter { it.isSupported }
            .maxByOrNull { it.priority }
    }

    fun getBackend(apiVersion: ApiVersion): BackendDescriptor? {
        return getAvailableBackends()
            .find { it.apiVersion == apiVersion && it.isSupported }
    }

    fun createContextFactory(apiVersion: ApiVersion): ContextFactory? {
        return factories.find { factory ->
            factory.createContext().apiVersion == apiVersion
        }
    }

    fun createDefaultFactory(): ContextFactory? {
        return getBestBackend()?.let { backend ->
            createContextFactory(backend.apiVersion)
        }
    }

    fun createResourceFactory(apiVersion: ApiVersion): ResourceFactory? {
        return factories
            .find { it.createContext().apiVersion == apiVersion }
            ?.createResourceFactory(apiVersion)
    }

    fun createDefaultResourceFactory(): ResourceFactory? {
        return getBestBackend()?.let { backend ->
            createResourceFactory(backend.apiVersion)
        }
    }

    private fun getPriorityForApi(apiVersion: ApiVersion): Int {
        return when (apiVersion) {
            ApiVersion.METAL -> 100
            ApiVersion.VULKAN -> 80
            ApiVersion.OPENGL_ES_3 -> 50
            ApiVersion.INVALID -> 0
        }
    }
}
