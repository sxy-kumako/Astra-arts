# Astra-arts

日式动漫 low-poly 夏夜微缩场景，使用 Three.js 构建。

[打开静态页面](https://sxy-kumako.github.io/Astra-arts/)

支持拖拽旋转、滚轮缩放和触控操作；包含暖色灯笼、烟花、流星、行走人物与樱花飘落。工具栏可暂停场景动态、自动环绕、分层查看和复位视角。

进入页面默认播放动画，不受系统“减少动态效果”设置影响。动画按钮在播放时显示 ⏸（点击暂停），暂停时显示 ▶（点击播放）。

`index.html` 是独立静态页面，内含运行代码，不依赖 CDN。可直接下载后用支持 WebGL 的现代浏览器打开。GitHub Pages 从 `main` 分支根目录发布。

![场景预览](preview.png)

当前线上页面恢复为 `8d592e4` 的 Three.js 程序生成场景，不加载 Blender 模型。

Blender 原生工程及阶段备份继续保留在本地 `blender/`；已导出的 GLB、`web/` 查看器与导出工具也保留备用。`npm run build:blender` 只生成本地 `preview-blender.html` 预览，不覆盖线上入口 `index.html`。
