// content.js
console.log('Gemini Stream Sentinel content script loaded.');

// 配置常量
const TARGET_URL_STRING = "StreamGenerate"; 
const MIN_DURATION = 2000; 
const DEBOUNCE_DELAY = 500; // 【优化】防抖设置为 500ms，体验比 3000ms 更丝滑；

const EXCLUDE_PATTERNS = [
  "thumbs_up",
  "thumbs_down",
  "batchexecute"
];

let debounceTimer = null;

/**
 * 触发通知逻辑
 */
function triggerNotification(entry) {
  // 只有当页面在后台时才通知
  if (document.hidden === true) {
    console.log('Gemini Stream Sentinel: Triggering Notification for', entry.name);
    
    // 【注意】这里不再调用 playSound()，只负责发信号
    try {
      chrome.runtime.sendMessage({
        action: "gemini_finished",
        data: {
          duration: entry.duration,
          url: entry.name
        }
      });
    } catch (e) {
      console.warn('Failed to send message to background:', e);
    }
  } else {
    console.log('Gemini Stream Sentinel: Request finished but page is visible. Ignoring.');
  }
}

/**
 * 核心过滤器
 */
function isGeminiStreamGenerate(entry) {
  const url = entry.name;

  if (EXCLUDE_PATTERNS.some(pattern => url.includes(pattern))) return false;
  if (!url.includes(TARGET_URL_STRING)) return false;

  // 打印调试日志
  console.log(`[Debug] Matched URL Pattern: ${url}, Duration: ${entry.duration}ms`);

  if (entry.duration <= MIN_DURATION) {
    console.log(`[Debug] Duration too short (${entry.duration}ms), ignoring.`);
    return false;
  }

  return true;
}

// 初始化 PerformanceObserver
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (isGeminiStreamGenerate(entry)) {
      console.log('Gemini StreamGenerate Finished!', entry);
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        triggerNotification(entry);
        debounceTimer = null;
      }, DEBOUNCE_DELAY);
    }
  });
});

observer.observe({ entryTypes: ['resource'] });