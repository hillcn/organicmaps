cmake_minimum_required(VERSION 3.18)
project(drape_bridge)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT DEFINED DRAPE_BRIDGE_BUILD_TYPE)
    set(DRAPE_BRIDGE_BUILD_TYPE "Release")
endif()

set(CMAKE_BUILD_TYPE ${DRAPE_BRIDGE_BUILD_TYPE})

option(DRAPE_ENABLE_VULKAN "Enable Vulkan backend" ON)
option(DRAPE_ENABLE_OPENGL "Enable OpenGL backend" ON)
option(DRAPE_ENABLE_METAL "Enable Metal backend" OFF)

set(DRAPE_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/backend_registry.cpp
)

if(DRAPE_ENABLE_OPENGL)
    list(APPEND DRAPE_SOURCES
        ${CMAKE_CURRENT_SOURCE_DIR}/gl/gl_resource_factory.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/gl/gl_backend_register.cpp
    )
endif()

if(DRAPE_ENABLE_VULKAN)
    list(APPEND DRAPE_SOURCES
        ${CMAKE_CURRENT_SOURCE_DIR}/vulkan/vulkan_resource_factory.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/vulkan/vulkan_backend_register.cpp
    )
endif()

if(DRAPE_ENABLE_METAL)
    list(APPEND DRAPE_SOURCES
        ${CMAKE_CURRENT_SOURCE_DIR}/metal/metal_resource_factory.mm
        ${CMAKE_CURRENT_SOURCE_DIR}/metal/metal_backend_register.mm
    )
endif()

add_library(drape_bridge STATIC ${DRAPE_SOURCES})

target_include_directories(drape_bridge PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/libs/drape
    ${CMAKE_SOURCE_DIR}/libs/base
)

target_link_libraries(drape_bridge
    PRIVATE
        base
)

if(DRAPE_ENABLE_VULKAN)
    target_link_libraries(drape_bridge PRIVATE
        Vulkan::Vulkan
    )
    target_compile_definitions(drape_bridge PRIVATE DRAPE_VULKAN_ENABLED=1)
endif()

if(DRAPE_ENABLE_OPENGL)
    target_link_libraries(drape_bridge PRIVATE
        ${OPENGL_LIBRARIES}
    )
    target_compile_definitions(drape_bridge PRIVATE DRAPE_OPENGL_ENABLED=1)
endif()

if(DRAPE_ENABLE_METAL)
    target_link_libraries(drape_bridge PRIVATE
        "-framework Metal"
        "-framework QuartzCore"
    )
    target_compile_definitions(drape_bridge PRIVATE DRAPE_METAL_ENABLED=1)
    set_source_files_properties(
        ${CMAKE_CURRENT_SOURCE_DIR}/metal/metal_resource_factory.mm
        ${CMAKE_CURRENT_SOURCE_DIR}/metal/metal_backend_register.mm
        PROPERTIES COMPILE_FLAGS "-fobjc-arc"
    )
endif()

target_compile_options(drape_bridge PRIVATE
    $<$<CONFIG:Release>:-O3>
    $<$<CONFIG:Debug>:-g -O0>
)

install(TARGETS drape_bridge
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
)

install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/
    DESTINATION include/drape_bridge
    FILES_MATCHING PATTERN "*.hpp"
    PATTERN "*.cpp" EXCLUDE
    PATTERN "*.mm" EXCLUDE
)
