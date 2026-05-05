"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorldMapDownloader_1 = require("./WorldMapDownloader");
async function main() {
    console.log('=== Organic Maps World/Coast Download Test ===\n');
    // 创建下载器实例，使用有效的版本号
    const dataVersion = 250505; // 2025年5月5日（有效的地图数据版本）
    const downloader = new WorldMapDownloader_1.WorldMapDownloader(dataVersion, './downloads');
    try {
        // 初始化Meta配置
        console.log('Initializing MetaConfig...');
        await downloader.initialize();
        console.log('MetaConfig initialized successfully\n');
        // 下载World地图
        console.log('Downloading World.mwm...');
        await downloader.downloadWorld();
        // 下载WorldCoasts地图
        console.log('Downloading WorldCoasts.mwm...');
        await downloader.downloadWorldCoasts();
        // 等待下载完成
        console.log('\nWaiting for downloads to complete...');
        await downloader.waitForCompletion();
        console.log('\n=== Download Test Completed ===');
    }
    catch (error) {
        console.error('Download test failed:', error);
        process.exit(1);
    }
}
main().catch(console.error);
