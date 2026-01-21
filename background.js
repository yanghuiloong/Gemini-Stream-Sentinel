// background.js
console.log('Gemini Stream Sentinel background loaded.');

// 1. 负责创建离屏文档并播放声音的函数
async function playSoundViaOffscreen() {
  try {
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

    // 尝试发送消息，并捕获可能的连接错误
    chrome.runtime.sendMessage({ action: 'play_audio' }).catch((error) => {
      console.warn('Failed to send play_audio message:', error);
    });
  } catch (e) {
    console.error('Failed to create or use offscreen document:', e);
  }
}

// 2. 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "gemini_finished") {
    
    // 播放自定义声音
    playSoundViaOffscreen().catch(err => console.error(err));

    // 准备通知 ID
    const targetTabId = sender.tab ? sender.tab.id : null;
    const notificationId = targetTabId ? `gemini_done_${targetTabId}` : 'gemini_done_general';

    // 创建通知逻辑优化：强制清除旧通知以确保弹窗 (Re-toast)
    // 即使全屏模式下系统收纳了通知，这里先 clear 再 create 可以确保通知状态是最新的
    // 并且有助于解决“僵尸通知”导致的后续不弹窗问题
    chrome.notifications.clear(notificationId, (wasCleared) => {
      try {
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Gemini 回答完成',
          message: '点击立即切换回对话',
          priority: 2,
          requireInteraction: true, // 保持通知不消失，直到用户交互
          silent: true // 保持静音，使用自定义声音
        });
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
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
