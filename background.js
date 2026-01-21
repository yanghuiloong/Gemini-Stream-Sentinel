// background.js
console.log('Gemini Stream Sentinel background loaded.');

// 1. 负责创建离屏文档并播放声音的函数
// 这是解决 Chrome 后台自动播放限制的唯一正解
async function playSoundViaOffscreen() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  // 如果没有离屏文档，就创建一个
  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Notification sound',
    });
  }

  // 发送播放命令给 offscreen.js
  chrome.runtime.sendMessage({ action: 'play_audio' });
}

// 2. 监听来自 content.js 的完成信号
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "gemini_finished") {
    
    // 收到消息后，立即调度 Offscreen 播放声音
    playSoundViaOffscreen();

    // 准备通知ID，包含 TabID 以便精准跳转
    const targetTabId = sender.tab ? sender.tab.id : null;
    const notificationId = targetTabId ? `gemini_done_${targetTabId}` : 'gemini_done_general';

    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Gemini 回答完成',
      message: '点击立即切换回对话',
      priority: 2,
      requireInteraction: true // 保持通知不自动消失
    });
  }
});

// 3. 点击通知跳转逻辑
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('gemini_done_')) {
    const tabId = parseInt(notificationId.split('_')[2]);
    
    if (tabId && !isNaN(tabId)) {
      chrome.tabs.get(tabId, (tab) => {
        if (!chrome.runtime.lastError) {
          // 激活标签页
          chrome.tabs.update(tabId, { active: true });
          // 激活 Chrome 窗口 (这一步很关键)
          chrome.windows.update(tab.windowId, { focused: true });
        } else {
          fallbackToAnyGeminiTab();
        }
      });
    } else {
      fallbackToAnyGeminiTab();
    }
  }
  // 点击后清除通知
  chrome.notifications.clear(notificationId);
});

// 备用方案：如果找不到原始 Tab，就找任意一个 Gemini Tab
function fallbackToAnyGeminiTab() {
  chrome.tabs.query({ url: "https://gemini.google.com/*" }, (tabs) => {
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
}