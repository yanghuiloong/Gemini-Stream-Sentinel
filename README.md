# Gemini Stream Sentinel

Gemini Stream Sentinel 是一款基于 Chrome Manifest V3 架构开发的浏览器扩展程序。用户在使用 Google Gemini 网页版时，在Gemini深度思考时后台监控 Gemini 回答进度，完成后发送弹窗提示。用户在gemini思考回答期间可以离开标签页，回答完成后一键返回。
# ✨ 核心功能

*   **智能流式监听**：利用 `PerformanceObserver` API 精准识别 Gemini 的 `StreamGenerate` 核心数据流，而非依赖不稳定的 DOM 轮询。
*   **后台静默工作**：通过 Chrome 后台资源调度策略，即使标签页被冻结，网络层监听依然有效。
*   **Offscreen 音频播放**：引入 **Offscreen API** 绕过浏览器自动播放策略限制，确保在后台也能 100% 稳定播放提示音。
*   **智能防打扰**：
    *   **可见性检测**：只有当 Gemini 页面处于后台（用户不可见）时才触发通知。
    *   **防抖机制**：内置 **500ms** 防抖，在保证灵敏度的同时，避免因网络波动造成的重复通知。
    *   **误触过滤**：自动排除点赞/点踩 (`thumbs_up`/`thumbs_down`) 等非生成式请求。
*   **一键回溯**：点击系统通知，自动激活 Chrome 窗口并精确跳转至对应的 Gemini 标签页。

## 📂 项目结构

```text
Gemini-Stream-Sentinel/
├── manifest.json      # 扩展配置文件 (Manifest V3)
├── background.js      # Service Worker，负责调度通知与离屏文档
├── content.js         # 注入脚本，负责监听网络请求流
├── offscreen.html     # 离屏文档容器，用于后台播放音频
├── offscreen.js       # 离屏脚本，执行音频播放逻辑
├── alert.mp3          # 提示音文件 (需用户自行放入)
└── icons/             # 图标文件夹
    └── icon128.png    # 扩展图标 (需用户自行放入)
```

## 🚀 安装指南

1.  **准备资源文件**：
    *   在项目根目录下放入一个音频文件，命名为 `alert.mp3`。
    *   在 `icons` 文件夹下放入一个图标文件，命名为 `icon128.png`。
2.  **打开开发者模式**：
    *   在 Chrome 浏览器地址栏输入 `chrome://extensions/`。
    *   开启右上角的 "开发者模式" (Developer mode) 开关。
3.  **加载扩展**：
    *   点击左上角的 "加载已解压的扩展程序" (Load unpacked)。
    *   选择包含上述文件的项目文件夹。

## 📖 使用说明

1.  打开 [Google Gemini](https://gemini.google.com) 网页。
2.  输入一个需要较长时间生成的问题（例如长文本写作、复杂代码生成）。
3.  **立刻切换到其他标签页**或最小化浏览器去处理其他事务。
4.  当 Gemini 回答完成时：
    *   你会听到“叮”的提示音。
    *   屏幕右下角会弹出系统通知。
    *   点击通知，浏览器将自动唤醒并跳转回 Gemini 对话界面。

## 🔧 技术细节与排查

*   **为什么没有声音？**
    *   请检查 `alert.mp3` 是否真实存在于根目录。
    *   请检查系统音量或 Chrome 标签页是否被静音。
*   **为什么没有通知？**
    *   请确保操作系统的“专注模式”或“勿扰模式”未拦截 Chrome 通知。
    *   只有当 Gemini 页面处于 `hidden` (后台) 状态时才会触发，如果页面在前台不会弹窗。
*   **指纹识别逻辑**：
    *   **目标 URL 特征**：包含 `StreamGenerate`。
    *   **过滤杂讯**：排除 `thumbs_up`, `thumbs_down`, `batchexecute`。
    *   **耗时阈值**：请求时长需大于 `2000ms`。

## 📜 License

MIT License
