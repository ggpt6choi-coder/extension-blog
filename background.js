// Naver Blog Exporter - Background Service Worker (Manifest V3)

// Helper to check if URL is Naver Mobile or PC Blog
function isNaverBlogUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'm.blog.naver.com' || parsed.hostname === 'blog.naver.com';
  } catch (e) {
    return false;
  }
}

// Convert PC Blog URL to Mobile Blog URL
function getMobileBlogUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'blog.naver.com') {
      parsed.hostname = 'm.blog.naver.com';
    }
    return parsed.toString();
  } catch (e) {
    return url;
  }
}

// Injects a premium notification toast inside the webpage
function showWebToast(tabId, message, isError = false) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    args: [message, isError],
    func: (msg, error) => {
      // Check if toast element already exists
      let toast = document.getElementById('nblm-toast-notification');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nblm-toast-notification';
        
        // CSS Style for modern glassmorphism toast
        const style = document.createElement('style');
        style.textContent = `
          #nblm-toast-notification {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 12px 20px;
            background: rgba(11, 15, 25, 0.9);
            color: #f3f4f6;
            border: 1px solid ${error ? '#ef4444' : '#03c75a'};
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(3, 199, 90, 0.2)'};
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            z-index: 10000000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          #nblm-toast-notification.show {
            opacity: 1;
            transform: translateY(0);
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
      }
      
      toast.textContent = msg;
      // Force layout reflow
      toast.offsetHeight;
      toast.className = 'show';
      
      setTimeout(() => {
        toast.className = '';
      }, 3000);
    }
  });
}

// Global Hotkeys Command Listener
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    // Ignore browser system pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return;
    }
    
    if (command === 'extract-text') {
      if (!isNaverBlogUrl(tab.url)) {
        showWebToast(tab.id, '❌ 네이버 블로그 페이지에서 실행해주세요.', true);
        return;
      }
      
      showWebToast(tab.id, '⏳ 본문 텍스트 추출 중...');
      const parsedUrl = new URL(tab.url);
      
      if (parsedUrl.hostname === 'm.blog.naver.com') {
        // 1. Mobile Blog: inject script directly to extract and copy
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const container = document.querySelector('.se-main-container') || document.getElementById('viewTypeSelector');
            if (!container) {
              alert('본문 영역을 찾을 수 없습니다.');
              return;
            }
            
            // Clean up and format markdown
            const rawText = container.innerText || '';
            const lines = rawText.split(/\r?\n/);
            const noiseKeywords = ['이웃추가','본문 기타 기능','공유하기','URL복사','신고하기','이 블로그의 체크인','이 장소의 다른 글','Previous image','Next image','댓글','공감','인쇄','본문 폰트 크기 조정','본문 폰트 크기 작게 보기','본문 폰트 크기 크게 보기','가','내돈내산 인증','방문','영수증','더보기','외 1개'];
            
            const cleanedLines = [];
            let prevWasEmpty = false;
            
            for (let line of lines) {
              const trimmed = line.trim();
              if (trimmed === '') {
                if (cleanedLines.length > 0 && !prevWasEmpty) {
                  cleanedLines.push('');
                  prevWasEmpty = true;
                }
                continue;
              }
              
              const isNoise = noiseKeywords.some(keyword => trimmed === keyword || (trimmed.includes(keyword) && trimmed.length < keyword.length + 5));
              if (isNoise) continue;
              
              cleanedLines.push(trimmed);
              prevWasEmpty = false;
            }
            
            const cleanedText = cleanedLines.join('\n').trim();
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const markdown = `# ${document.title}

- **출처**: ${window.location.href}
- **수집일**: ${dateStr}

---

${cleanedText}
`;
            
            // Copy to clipboard
            const textarea = document.createElement('textarea');
            textarea.value = markdown;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }
        });
        showWebToast(tab.id, '📋 복사 완료! 노트북LM에 붙여넣으세요.');
      } else {
        // 2. PC Blog: Fetch Mobile URL in background, and pass to Active Tab for parsing
        const mobileUrl = getMobileBlogUrl(tab.url);
        const response = await fetch(mobileUrl);
        if (!response.ok) {
          showWebToast(tab.id, '❌ 네이버 서버 통신 실패', true);
          return;
        }
        
        const html = await response.text();
        
        // Pass HTML content and mobileUrl into the active page DOM parser
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [html, mobileUrl, tab.title],
          func: (htmlSource, mUrl, fallbackTitle) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlSource, 'text/html');
            const container = doc.querySelector('.se-main-container') || doc.querySelector('#viewTypeSelector');
            
            if (!container) {
              alert('본문 영역을 찾을 수 없습니다.');
              return;
            }
            
            const rawText = container.innerText || '';
            const lines = rawText.split(/\r?\n/);
            const noiseKeywords = ['이웃추가','본문 기타 기능','공유하기','URL복사','신고하기','이 블로그의 체크인','이 장소의 다른 글','Previous image','Next image','댓글','공감','인쇄','본문 폰트 크기 조정','본문 폰트 크기 작게 보기','본문 폰트 크기 크게 보기','가','내돈내산 인증','방문','영수증','더보기','외 1개'];
            
            const cleanedLines = [];
            let prevWasEmpty = false;
            
            for (let line of lines) {
              const trimmed = line.trim();
              if (trimmed === '') {
                if (cleanedLines.length > 0 && !prevWasEmpty) {
                  cleanedLines.push('');
                  prevWasEmpty = true;
                }
                continue;
              }
              
              const isNoise = noiseKeywords.some(keyword => trimmed === keyword || (trimmed.includes(keyword) && trimmed.length < keyword.length + 5));
              if (isNoise) continue;
              
              cleanedLines.push(trimmed);
              prevWasEmpty = false;
            }
            
            const cleanedText = cleanedLines.join('\n').trim();
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const markdown = `# ${doc.title || fallbackTitle}

- **출처**: ${mUrl}
- **수집일**: ${dateStr}

---

${cleanedText}
`;
            
            // Copy
            const textarea = document.createElement('textarea');
            textarea.value = markdown;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }
        });
        showWebToast(tab.id, '📋 복사 완료! 노트북LM에 붙여넣으세요.');
      }
    } 
    
    else if (command === 'save-html') {
      showWebToast(tab.id, '⏳ HTML 소스 파일 빌드 중...');
      
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.documentElement.outerHTML;
        }
      });
      
      if (result && result.result) {
        const htmlContent = `<!DOCTYPE html>\n${result.result}`;
        
        // Base64 encoding to download from Service Worker without URL.createObjectURL
        // Use btoa with encodeURIComponent to support UTF-8 characters safely
        const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
        const dataUrl = `data:text/html;base64,${base64Html}`;
        
        const sanitizeTitle = (tab.title || 'webpage')
          .replace(/[\\/:*?"<>|]/g, '_')
          .substring(0, 30);
          
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const filename = `${sanitizeTitle}_${dateStr}.html`;
        
        await chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: false
        });
        showWebToast(tab.id, '💾 HTML 파일 다운로드 시작!');
      } else {
        showWebToast(tab.id, '❌ HTML 추출 실패', true);
      }
    } 
    
    else if (command === 'save-pdf') {
      showWebToast(tab.id, '⏳ PDF 파일 생성 중...');
      let pdfSaved = false;
      try {
        await chrome.debugger.attach({ tabId: tab.id }, '1.3');
        const result = await chrome.debugger.sendCommand(
          { tabId: tab.id },
          'Page.printToPDF',
          {
            printBackground: true,
            paperWidth: 8.27,
            paperHeight: 11.69,
            marginTop: 0.4,
            marginBottom: 0.4,
            marginLeft: 0.4,
            marginRight: 0.4
          }
        );
        await chrome.debugger.detach({ tabId: tab.id });

        if (result && result.data) {
          const dataUrl = `data:application/pdf;base64,${result.data}`;
          const sanitizeTitle = (tab.title || 'webpage')
            .replace(/[\\/:*?"<>|]/g, '_')
            .substring(0, 30);
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const filename = `${sanitizeTitle}_${dateStr}.pdf`;

          await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
          });
          showWebToast(tab.id, '📄 PDF 파일 다운로드 시작!');
          pdfSaved = true;
        }
      } catch (err) {
        console.warn('Background save-pdf debugger failed:', err);
        try { await chrome.debugger.detach({ tabId: tab.id }); } catch (e) {}
      }

      if (!pdfSaved) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => { window.print(); }
          });
          showWebToast(tab.id, '🖨️ 인쇄/PDF 저장 창이 열렸습니다.');
        } catch (err) {
          showWebToast(tab.id, '❌ PDF 생성 실패', true);
        }
      }
    }

    else if (command === 'capture-page') {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showWebToast(tab.id, '❌ 시스템 페이지는 캡처할 수 없습니다.', true);
        return;
      }

      if (tab.url.startsWith('file://')) {
        const isAllowed = await chrome.extension.isAllowedFileSchemeAccess();
        if (!isAllowed) {
          showWebToast(tab.id, '❌ 로컬 파일 접근 권한 필요 (확장프로그램 세부정보에서 허용 필요)', true);
          return;
        }
      }

      showWebToast(tab.id, '📸 전체 스크롤 캡처 시작 (잠시 대기)...');
      
      // 1. Get dimension parameters from active tab
      const [dimensionsResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
            clientHeight: document.documentElement.clientHeight,
            clientWidth: document.documentElement.clientWidth,
            devicePixelRatio: window.devicePixelRatio || 1,
            originalX: window.scrollX,
            originalY: window.scrollY
          };
        }
      });
      
      if (!dimensionsResult || !dimensionsResult.result) {
        showWebToast(tab.id, '❌ 페이지 크기 측정 실패', true);
        return;
      }
      
      const dim = dimensionsResult.result;
      const totalHeight = dim.scrollHeight;
      const viewportHeight = dim.clientHeight;
      const viewportWidth = dim.clientWidth;
      const pixelRatio = dim.devicePixelRatio;
      
      // Hide scrollbar
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { document.body.style.overflow = 'hidden'; }
      });
      
      const captures = [];
      const scrollPositions = [];
      let currentY = 0;
      
      // 2. Loop scroll & capture
      while (currentY < totalHeight) {
        const scrollY = Math.min(currentY, totalHeight - viewportHeight);
        scrollPositions.push(scrollY);
        
        // Scroll tab
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [scrollY],
          func: (y) => { window.scrollTo(0, y); }
        });
        
        // Render wait delay
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // Capture screenshot of visible tab viewport
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        captures.push(dataUrl);
        
        if (scrollY >= totalHeight - viewportHeight) {
          break;
        }
        currentY += viewportHeight;
      }
      
      // 3. Restore scrollbar and position
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [dim.originalX, dim.originalY],
        func: (ox, oy) => {
          document.body.style.overflow = '';
          window.scrollTo(ox, oy);
        }
      });
      
      // 4. Inject canvas stitching & download execution into the active tab's page context
      showWebToast(tab.id, '🧩 이미지 조각 병합 및 저장 중...');
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [captures, scrollPositions, viewportWidth, totalHeight, pixelRatio, tab.title],
        func: async (imgs, positions, w, h, ratio, rawTitle) => {
          const canvas = document.createElement('canvas');
          canvas.width = w * ratio;
          canvas.height = h * ratio;
          const ctx = canvas.getContext('2d');
          
          // Draw each capture piece onto the canvas
          for (let i = 0; i < imgs.length; i++) {
            const dataUrl = imgs[i];
            const scrollY = positions[i];
            
            await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, scrollY * ratio);
                resolve();
              };
              img.src = dataUrl;
            });
          }
          
          // Convert canvas drawing to PNG dataURL
          const mergedDataUrl = canvas.toDataURL('image/png');
          
          // Download directly from client tab DOM context
          const sanitizeTitle = (rawTitle || 'screenshot')
            .replace(/[\\/:*?"<>|]/g, '_')
            .substring(0, 30);
            
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const filename = `${sanitizeTitle}_full_${dateStr}.png`;
          
          const a = document.createElement('a');
          a.href = mergedDataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
      
      showWebToast(tab.id, '💾 캡처 파일 다운로드 완료!');
    }
  } catch (err) {
    console.error('Background command error:', err);
  }
});
