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
      
      // Safe capture helper with retry backoff to avoid MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota
      const safeCaptureVisibleTab = async (windowId = null, options = { format: 'png' }, maxRetries = 4) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await chrome.tabs.captureVisibleTab(windowId, options);
          } catch (err) {
            const isQuotaErr = err?.message && err.message.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
            if (isQuotaErr && attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 600 + attempt * 300));
              continue;
            }
            throw err;
          }
        }
      };

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
        
        // 초기 렌더 대기
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // 현재 뷰포트 내 lazy-load 이미지가 모두 로드될 때까지 대기 (최대 2.5초)
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => new Promise((resolve) => {
            const maxWait = setTimeout(resolve, 2500);
            const imgs = [...document.querySelectorAll('img')].filter(img => {
              const r = img.getBoundingClientRect();
              return r.top < window.innerHeight && r.bottom > 0 && r.width > 0;
            });
            if (!imgs.length) { clearTimeout(maxWait); resolve(); return; }
            let count = 0;
            const done = () => { if (++count >= imgs.length) { clearTimeout(maxWait); resolve(); } };
            imgs.forEach(img => {
              if (img.complete && img.naturalWidth > 0) done();
              else {
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              }
            });
          })
        });
        
        // Capture screenshot of visible tab viewport
        const dataUrl = await safeCaptureVisibleTab(null, { format: 'png' });
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
          // Preload all images to get exact physical dimensions
          const loadedImages = await Promise.all(
            imgs.map((dataUrl) => new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = (e) => reject(new Error('이미지 조각 로드 실패: ' + e));
              img.src = dataUrl;
            }))
          );

          if (loadedImages.length === 0) return;

          const firstImg = loadedImages[0];
          // Calculate exact scale from the first captured image to prevent any sub-pixel blur
          const actualScale = firstImg.naturalWidth / w;
          const finalWidth = firstImg.naturalWidth;
          const finalHeight = Math.round(h * actualScale);

          const canvas = document.createElement('canvas');
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          const ctx = canvas.getContext('2d', { alpha: false });

          // Maintain 1:1 crisp pixel sharpness (prevent blurring interpolation)
          ctx.imageSmoothingEnabled = false;

          // Draw each capture piece onto the canvas with exact integer coordinates
          // 마지막 조각을 제외한 각 조각은 다음 스크롤 위치까지만 클리핑하여
          // 겹침(overlap)으로 인한 빈 공간/검정 영역 방지
          for (let i = 0; i < loadedImages.length; i++) {
            const img = loadedImages[i];
            const scrollY = positions[i];
            const drawY = Math.round(scrollY * actualScale);

            if (i < loadedImages.length - 1) {
              // 비-마지막 조각: 다음 스크롤 위치까지만 그려 겹침 제거
              const nextScrollY = positions[i + 1];
              const clipH = Math.round((nextScrollY - scrollY) * actualScale);
              ctx.drawImage(
                img,
                0, 0, img.naturalWidth, clipH,
                0, drawY, img.naturalWidth, clipH
              );
            } else {
              // 마지막 조각: 나머지 전체 영역을 그대로 그림
              ctx.drawImage(
                img,
                0, 0, img.naturalWidth, img.naturalHeight,
                0, drawY, img.naturalWidth, img.naturalHeight
              );
            }
          }

          // Convert canvas drawing to high-quality PNG Blob
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (!blob) return;
          const blobUrl = URL.createObjectURL(blob);

          // Download directly from client tab DOM context
          const sanitizeTitle = (rawTitle || 'screenshot')
            .replace(/[\\/:*?"<>|]/g, '_')
            .substring(0, 30);

          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const filename = `${sanitizeTitle}_full_${dateStr}.png`;

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        }
      });
      
      showWebToast(tab.id, '💾 캡처 파일 다운로드 완료!');
    }
  } catch (err) {
    console.error('Background command error:', err);
  }
});

// =========================================================================
// Background Auto Comment Execution & State Management
// =========================================================================
let autoCommentAbortRequested = false;
let autoCommentState = {
  isRunning: false,
  currentStep: 0,
  totalSteps: 0,
  successCount: 0,
  statusText: '',
  statusColor: '',
  finished: false,
  error: null
};

async function broadcastAutoCommentState(stateUpdate) {
  autoCommentState = { ...autoCommentState, ...stateUpdate };
  await chrome.storage.local.set({ autoCommentState });
  try {
    chrome.runtime.sendMessage({
      type: 'AUTO_COMMENT_STATE_UPDATE',
      state: autoCommentState
    }).catch(() => {});
  } catch (e) {}
}

function stopAutoCommentTask() {
  if (autoCommentState.isRunning) {
    autoCommentAbortRequested = true;
  }
}

async function runAutoCommentTask({ commentsList, autoSubmit, delaySec }) {
  if (autoCommentState.isRunning) return;

  autoCommentAbortRequested = false;

  await broadcastAutoCommentState({
    isRunning: true,
    currentStep: 0,
    totalSteps: 0,
    successCount: 0,
    statusText: '카페 탭 조회 중...',
    statusColor: 'var(--text-sub)',
    finished: false,
    error: null
  });

  try {
    const cafeTabs = await chrome.tabs.query({
      url: ["*://cafe.naver.com/*"],
      currentWindow: true
    });

    const validCafeTabs = cafeTabs.filter(tab => {
      if (!tab.url) return false;
      return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
    }).sort((a, b) => a.index - b.index);

    if (validCafeTabs.length === 0) {
      throw new Error('댓글을 입력할 네이버 카페 탭이 없습니다.');
    }

    const totalToProcess = Math.min(validCafeTabs.length, commentsList.length);
    let successCount = 0;

    await broadcastAutoCommentState({
      totalSteps: totalToProcess,
      statusText: `댓글 자동 입력 시작 (대상 탭: ${totalToProcess}개)...`
    });

    for (let i = 0; i < totalToProcess; i++) {
      if (autoCommentAbortRequested) {
        await broadcastAutoCommentState({
          isRunning: false,
          successCount: successCount,
          statusText: `중단됨 (성공: ${successCount}/${totalToProcess}개 완료)`,
          statusColor: 'var(--danger)',
          finished: true
        });
        try {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab && activeTab.id) {
            showWebToast(activeTab.id, `⏹️ 댓글 자동 입력이 중단되었습니다. (${successCount}/${totalToProcess}개 완료)`);
          }
        } catch (e) {}
        return;
      }

      const tab = validCafeTabs[i];
      const commentText = commentsList[i];

      await broadcastAutoCommentState({
        currentStep: i + 1,
        statusText: `${i + 1}/${totalToProcess}번째 탭 댓글 입력 중...`
      });

      try {
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: async (text, shouldAutoSubmit) => {
            const waitForElement = async (selectorFn, maxWaitMs = 3000) => {
              const startTime = Date.now();
              while (Date.now() - startTime < maxWaitMs) {
                const el = selectorFn();
                if (el) return el;
                await new Promise(r => setTimeout(r, 200));
              }
              return null;
            };

            const findTextarea = () => {
              return document.querySelector('.comment_inbox_text') || 
                     document.querySelector('textarea.comment_inbox_text') ||
                     document.getElementById('comment_text') ||
                     document.querySelector('.CommentWriter textarea');
            };

            const textarea = await waitForElement(findTextarea, 3000);
            if (!textarea) return null;

            // 중복 실행 방지 가드
            const now = Date.now();
            if (window.__nblm_last_comment_time && (now - window.__nblm_last_comment_time < 5000)) {
              return { success: true, submitted: true, skipped: true };
            }
            window.__nblm_last_comment_time = now;

            textarea.focus();
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (nativeTextAreaValueSetter) {
              nativeTextAreaValueSetter.call(textarea, text);
            } else {
              textarea.value = text;
            }

            textarea.dispatchEvent(new Event('focus', { bubbles: true }));
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

            if (shouldAutoSubmit) {
              await new Promise(r => setTimeout(r, 400));

              const findRegisterBtn = () => {
                const writer = textarea.closest('.CommentWriter') || textarea.closest('.comment_inbox') || document;
                let btn = writer.querySelector('.btn_register') ||
                          writer.querySelector('.register_box .btn_register') ||
                          writer.querySelector('a.btn_register') ||
                          writer.querySelector('button.btn_register') ||
                          document.querySelector('.CommentWriter .btn_register') ||
                          document.querySelector('.btn_register') ||
                          document.getElementById('comment_register_button');
                if (btn) return btn;

                const allClickables = Array.from(writer.querySelectorAll('button, a, div[role="button"]'));
                return allClickables.find(el => el.textContent && el.textContent.trim() === '등록');
              };

              const registerBtn = await waitForElement(findRegisterBtn, 2000);
              if (registerBtn) {
                registerBtn.focus();
                if (typeof registerBtn.click === 'function') {
                  registerBtn.click();
                } else {
                  registerBtn.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  }));
                }
                return { success: true, submitted: true };
              }
              return { success: true, submitted: false, error: '등록 버튼을 찾을 수 없습니다.' };
            }
            return { success: true, submitted: false };
          },
          args: [commentText, autoSubmit]
        });

        let injected = false;
        if (injectionResults && injectionResults.length > 0) {
          for (const res of injectionResults) {
            if (res.result && res.result.success) {
              injected = true;
              break;
            }
          }
        }

        if (injected) {
          successCount++;
        }
      } catch (injectErr) {
        console.error(`Background auto-comment error for tab ${tab.id}:`, injectErr);
      }

      if (autoCommentAbortRequested) {
        await broadcastAutoCommentState({
          isRunning: false,
          successCount: successCount,
          statusText: `중단됨 (성공: ${successCount}/${totalToProcess}개 완료)`,
          statusColor: 'var(--danger)',
          finished: true
        });
        try {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab && activeTab.id) {
            showWebToast(activeTab.id, `⏹️ 댓글 자동 입력이 중단되었습니다. (${successCount}/${totalToProcess}개 완료)`);
          }
        } catch (e) {}
        return;
      }

      // Keep-Alive chunked sleep with live countdown (supports 50s, 60s, or any long delays)
      if (i < totalToProcess - 1) {
        const totalDelaySec = Math.max(1, Math.round(delaySec || 5));
        
        for (let s = totalDelaySec; s > 0; s--) {
          if (autoCommentAbortRequested) break;

          await broadcastAutoCommentState({
            currentStep: i + 1,
            statusText: `${i + 1}/${totalToProcess}번째 완료 (다음 탭까지 ${s}초 대기 중...)`,
            statusColor: 'var(--text-sub)'
          });
          
          await new Promise(r => setTimeout(r, 1000));
          
          // Chrome Service Worker Keep-Alive heartbeat ping every 5 seconds
          if (s % 5 === 0) {
            try { 
              await chrome.runtime.getPlatformInfo(); 
            } catch (e) {}
          }
        }

        if (autoCommentAbortRequested) {
          await broadcastAutoCommentState({
            isRunning: false,
            successCount: successCount,
            statusText: `중단됨 (성공: ${successCount}/${totalToProcess}개 완료)`,
            statusColor: 'var(--danger)',
            finished: true
          });
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && activeTab.id) {
              showWebToast(activeTab.id, `⏹️ 댓글 자동 입력이 중단되었습니다. (${successCount}/${totalToProcess}개 완료)`);
            }
          } catch (e) {}
          return;
        }
      }
    }

    await broadcastAutoCommentState({
      isRunning: false,
      successCount: successCount,
      statusText: `입력 완료! (성공: ${successCount}/${totalToProcess}개)`,
      statusColor: 'var(--accent-naver)',
      finished: true
    });

    // Notify active tab with toast
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        showWebToast(activeTab.id, `🎉 댓글 일괄 입력 완료! (${successCount}/${totalToProcess}개 성공)`);
      }
    } catch (e) {}

  } catch (err) {
    console.error('Auto comment background task failed:', err);
    await broadcastAutoCommentState({
      isRunning: false,
      statusText: `실패: ${err.message || err}`,
      statusColor: 'var(--danger)',
      finished: true,
      error: err.message
    });

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        showWebToast(activeTab.id, `❌ 댓글 입력 실패: ${err.message || err}`, true);
      }
    } catch (e) {}
  }
}

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_AUTO_COMMENT') {
    runAutoCommentTask(message.payload);
    sendResponse({ started: true });
    return true;
  }
  if (message.type === 'STOP_AUTO_COMMENT') {
    stopAutoCommentTask();
    sendResponse({ stopped: true });
    return true;
  }
  if (message.type === 'GET_AUTO_COMMENT_STATE') {
    sendResponse({ state: autoCommentState });
    return true;
  }
});

