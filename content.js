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
  // 综合判断：页面不可见 (Tab切换/最小化) OR 页面失去焦点 (用户在使用其他App)
  const isHidden = document.hidden === true;
  const isBlur = document.hasFocus() === false;

  if (isHidden || isBlur) {
    console.log(`Gemini Stream Sentinel: Triggering Notification. (Hidden: ${isHidden}, Blur: ${isBlur})`, entry.name);
    
    // 【关键修复】发送前检查扩展上下文是否有效
    try {
      if (typeof chrome.runtime === 'undefined' || !chrome.runtime.sendMessage) {
        throw new Error('Extension context invalidated');
      }

      chrome.runtime.sendMessage({
        action: "gemini_finished",
        data: {
          duration: entry.duration,
          url: entry.name
        }
      });
    } catch (e) {
      // 捕获上下文失效错误，给出友好提示
      const isContextInvalidated = e.message === 'Extension context invalidated' || 
                                   (e.message && e.message.includes('Extension context invalidated')) ||
                                   (e.message && e.message.includes('Invocation of form runtime.connect(null, ) failed'));

      if (isContextInvalidated) {
        console.log('%cGemini Stream Sentinel: Extension updated or reloaded. Please refresh the page to reconnect.', 'color: #ff9800; font-weight: bold;');
      } else {
        console.warn('Failed to send message to background:', e);
      }
    }
  } else {
    console.log('Gemini Stream Sentinel: Request finished but page is visible and focused. Ignoring.');
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
