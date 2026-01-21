// background.js
console.log('Gemini Stream Sentinel background loaded.');

// 1. 负责创建离屏文档并播放声音的函数
async function playSoundViaOffscreen() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Notification sound',
    });
  }

  chrome.runtime.sendMessage({ action: 'play_audio' });
}

// 2. 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "gemini_finished") {
    
    // 播放自定义声音
    playSoundViaOffscreen();

    // 准备通知 ID
    const targetTabId = sender.tab ? sender.tab.id : null;
    const notificationId = targetTabId ? `gemini_done_${targetTabId}` : 'gemini_done_general';

    // 创建通知
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Gemini 回答完成',
      message: '点击立即切换回对话',
      priority: 2,
      requireInteraction: true,
      
      // 【关键修复：Agent 的建议】
      // 禁止系统默认的通知音，避免和 alert.mp3 重叠
      silent: true 
    });
  }
});

// 3. 点击跳转逻辑
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('gemini_done_')) {
    const tabId = parseInt(notificationId.split('_')[2]);
    if (tabId && !isNaN(tabId)) {
      chrome.tabs.get(tabId, (tab) => {
        if (!chrome.runtime.lastError) {
          chrome.tabs.update(tabId, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
        } else {
          fallbackToAnyGeminiTab();
        }
      });
    } else {
      fallbackToAnyGeminiTab();
    }
  }
  chrome.notifications.clear(notificationId);
});

function fallbackToAnyGeminiTab() {
  chrome.tabs.query({ url: "https://gemini.google.com/*" }, (tabs) => {
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
}