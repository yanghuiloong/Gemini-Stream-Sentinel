chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'play_audio') {
    // 获取资源 URL
    const audioUrl = chrome.runtime.getURL('alert.mp3');
    const audio = new Audio(audioUrl);
    
    audio.play().catch(error => {
      console.error("Offscreen audio play failed:", error);
    });
  }
});