document.addEventListener('DOMContentLoaded', async () => {
  const activeTitle = document.getElementById('active-title');
  const activeUrl = document.getElementById('active-url');
  const activeStatusBadge = document.getElementById('active-status-badge');
  const copyBtn = document.getElementById('copy-btn');
  const copySpinner = document.getElementById('copy-spinner');
  
  const batchCount = document.getElementById('batch-count');
  const batchBtn = document.getElementById('batch-btn');
  const batchSpinner = document.getElementById('batch-spinner');
  
  const htmlSaveBtn = document.getElementById('html-save-btn');
  const htmlSaveSpinner = document.getElementById('html-save-spinner');
  const pdfSaveBtn = document.getElementById('pdf-save-btn');
  const pdfSaveSpinner = document.getElementById('pdf-save-spinner');

  const imageCount = document.getElementById('image-count');
  const imageDownloadBtn = document.getElementById('image-download-btn');
  const imageDownloadSpinner = document.getElementById('image-download-spinner');

  const cafeCount = document.getElementById('cafe-count');
  const cafeCopyBtn = document.getElementById('cafe-copy-btn');
  const cafeCopySpinner = document.getElementById('cafe-copy-spinner');
  const cafeSaveBtn = document.getElementById('cafe-save-btn');
  const cafeSaveSpinner = document.getElementById('cafe-save-spinner');
  
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  
  // Tab Switcher Elements
  const tabBtnBlog = document.getElementById('tab-btn-blog');
  const tabBtnCafe = document.getElementById('tab-btn-cafe');
  const containerBlog = document.getElementById('container-blog');
  const containerCafe = document.getElementById('container-cafe');
  
  // Tab Opener Elements
  const tabOpenerTemplate = document.getElementById('tab-opener-template');
  const tabOpenerStart = document.getElementById('tab-opener-start');
  const tabOpenerEnd = document.getElementById('tab-opener-end');
  const tabOpenerBtn = document.getElementById('tab-opener-btn');
  const tabOpenerSpinner = document.getElementById('tab-opener-spinner');

  // Auto Comment Elements
  const commentCountBadge = document.getElementById('comment-count-badge');
  const commentMatchStatus = document.getElementById('comment-match-status');
  const commentJsonInput = document.getElementById('comment-json-input');
  const commentAutoSubmit = document.getElementById('comment-auto-submit');
  const commentDelay = document.getElementById('comment-delay');
  const commentAutoBtn = document.getElementById('comment-auto-btn');
  const commentAutoSpinner = document.getElementById('comment-auto-spinner');
  const commentProgressStatus = document.getElementById('comment-progress-status');

  let detectedCafeTabsCount = 0;
  let parsedComments = {};
  let currentTab = null;

  // Function to show toast message
  function showToast(message, isError = false) {
    toastText.textContent = message;
    if (isError) {
      toast.classList.add('toast-error');
    } else {
      toast.classList.remove('toast-error');
    }
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

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

  // Tab Switcher Functions & Handlers
  function switchTab(tabId) {
    if (tabId === 'cafe') {
      tabBtnBlog.classList.remove('active');
      tabBtnCafe.classList.add('active');
      containerBlog.classList.remove('active');
      containerCafe.classList.add('active');
      try {
        chrome.storage.local.set({ activeTab: 'cafe' });
      } catch (e) {
        console.error(e);
      }
    } else {
      tabBtnBlog.classList.add('active');
      tabBtnCafe.classList.remove('active');
      containerBlog.classList.add('active');
      containerCafe.classList.remove('active');
      try {
        chrome.storage.local.set({ activeTab: 'blog' });
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (tabBtnBlog && tabBtnCafe) {
    tabBtnBlog.addEventListener('click', () => switchTab('blog'));
    tabBtnCafe.addEventListener('click', () => switchTab('cafe'));
  }

  // Load last active tab from storage on startup
  try {
    chrome.storage.local.get('activeTab', (result) => {
      if (result && result.activeTab === 'cafe') {
        switchTab('cafe');
      } else {
        switchTab('blog');
      }
    });
  } catch (e) {
    console.error('Failed to load active tab from storage:', e);
    switchTab('blog');
  }

  // Initialize
  try {
    // 1. Check active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab) {
      activeTitle.textContent = tab.title || '-';
      activeUrl.textContent = tab.url || '-';
      
      if (isNaverBlogUrl(tab.url)) {
        activeStatusBadge.textContent = '추출 가능';
        activeStatusBadge.className = 'badge badge-success';
        copyBtn.disabled = false;
      } else {
        activeStatusBadge.textContent = '추출 불가';
        activeStatusBadge.className = 'badge badge-error';
        copyBtn.disabled = true;
      }

      // Enable HTML and PDF save buttons if it's not a chrome/system page
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
        htmlSaveBtn.disabled = false;
        pdfSaveBtn.disabled = false;
        
        // Count images on active tab
        let hasAccess = true;
        if (tab.url.startsWith('file://')) {
          hasAccess = await chrome.extension.isAllowedFileSchemeAccess();
        }
        
        if (hasAccess) {
          try {
            const [imagesResult] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs
                  .map(img => img.src)
                  .filter(src => {
                    if (!src) return false;
                    if (src.startsWith('data:')) {
                      // Filter out extremely small spacer base64 data URLs
                      return src.length > 250;
                    }
                    return true;
                  });
              }
            });
            
            if (imagesResult && imagesResult.result) {
              const imgUrls = imagesResult.result;
              imageCount.textContent = `${imgUrls.length}개 감지됨`;
              if (imgUrls.length > 0) {
                imageDownloadBtn.disabled = false;
                imageDownloadBtn.dataset.urls = JSON.stringify(imgUrls);
              } else {
                imageDownloadBtn.disabled = true;
              }
            }
          } catch (e) {
            console.error('Image counting failed:', e);
            imageCount.textContent = '감지 실패';
          }
        } else {
          imageCount.textContent = '권한 부족 (file://)';
        }
      } else {
        htmlSaveBtn.disabled = true;
        pdfSaveBtn.disabled = true;
        imageCount.textContent = '지원 불가 페이지';
      }
    } else {
      activeStatusBadge.textContent = '탭 정보 없음';
      activeStatusBadge.className = 'badge badge-error';
      copyBtn.disabled = true;
      htmlSaveBtn.disabled = true;
      pdfSaveBtn.disabled = true;
      imageCount.textContent = '탭 정보 없음';
    }
    
    // 2. Count open Naver Blog tabs for Batch Mode
    const naverTabs = await chrome.tabs.query({
      url: ["*://m.blog.naver.com/*", "*://blog.naver.com/*"],
      currentWindow: true
    });
    batchCount.textContent = `${naverTabs.length}개 탭 감지됨`;
    if (naverTabs.length > 0) {
      batchBtn.disabled = false;
    } else {
      batchBtn.disabled = true;
    }

    // 3. Count open Naver Cafe tabs for Cafe Mode
    const cafeTabs = await chrome.tabs.query({
      url: ["*://cafe.naver.com/*"],
      currentWindow: true
    });
    const validCafeTabs = cafeTabs.filter(tab => {
      if (!tab.url) return false;
      return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
    });
    cafeCount.textContent = `${validCafeTabs.length}개 탭 감지됨`;
    if (validCafeTabs.length > 0) {
      cafeCopyBtn.disabled = false;
      cafeSaveBtn.disabled = false;
    } else {
      cafeCopyBtn.disabled = true;
      cafeSaveBtn.disabled = true;
    }
    
    // Auto Comment Initialization
    detectedCafeTabsCount = validCafeTabs.length;
    updateCommentMatchStatus();
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('초기화 중 오류가 발생했습니다.', true);
  }

  // Content script function (injected to webpage)
  function extractNaverBlogText() {
    // Try smart editor ONE main text container first to avoid header/footer noise
    let container = document.querySelector('.se-main-container');
    if (!container) {
      container = document.getElementById('viewTypeSelector');
    }
    
    if (!container) {
      return { success: false, error: '본문 영역을 찾을 수 없습니다.' };
    }
    
    // Extract innerText of the main article container
    const text = container.innerText || '';
    return { 
      success: true, 
      text: text, 
      title: document.title, 
      url: window.location.href 
    };
  }

  // Format extracted data into NotebookLM optimized markdown
  function cleanAndFormatText(text, title, url) {
    // 1. Split into lines
    const lines = text.split(/\r?\n/);
    
    // 2. Define noise keywords to filter out typical blog UI boilerplate
    const noiseKeywords = [
      '이웃추가',
      '본문 기타 기능',
      '공유하기',
      'URL복사',
      '신고하기',
      '이 블로그의 체크인',
      '이 장소의 다른 글',
      'Previous image',
      'Next image',
      '댓글',
      '공감',
      '인쇄',
      '본문 폰트 크기 조정',
      '본문 폰트 크기 작게 보기',
      '본문 폰트 크기 크게 보기',
      '가',
      '내돈내산 인증',
      '방문',
      '영수증',
      '더보기',
      '외 1개'
    ];
    
    const cleanedLines = [];
    let prevWasEmpty = false;
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines or line containing only whitespace/tabs
      if (trimmed === '') {
        if (cleanedLines.length > 0 && !prevWasEmpty) {
          cleanedLines.push('');
          prevWasEmpty = true;
        }
        continue;
      }
      
      // Skip noise keywords
      const isNoise = noiseKeywords.some(keyword => {
        return trimmed === keyword || 
               (trimmed.includes(keyword) && trimmed.length < keyword.length + 5); 
      });
      if (isNoise) {
        continue;
      }
      
      cleanedLines.push(trimmed);
      prevWasEmpty = false;
    }
    
    // Join back
    let cleanedText = cleanedLines.join('\n');
    cleanedText = cleanedText.trim();
    
    // YYYY-MM-DD Date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    return `# ${title}

- **출처**: ${url}
- **수집일**: ${dateStr}

---

${cleanedText}
`;
  }

  // Helper to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      // Fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (fallbackErr) {
        console.error('Fallback clipboard copy failed:', fallbackErr);
        return false;
      }
    }
  }

  // Single Extract & Copy Event Handler
  copyBtn.addEventListener('click', async () => {
    if (!currentTab || !isNaverBlogUrl(currentTab.url)) {
      alert("네이버 블로그 페이지에서 실행해주세요.");
      return;
    }
    
    copyBtn.disabled = true;
    copySpinner.style.display = 'inline-block';
    
    try {
      let data = null;
      const parsedUrl = new URL(currentTab.url);

      if (parsedUrl.hostname === 'm.blog.naver.com') {
        // Mobile blog: directly inject script
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: extractNaverBlogText
        });
        if (result && result.result) {
          data = result.result;
        }
      } else {
        // PC blog: fetch mobile version in background
        const mobileUrl = getMobileBlogUrl(currentTab.url);
        const response = await fetch(mobileUrl);
        if (!response.ok) {
          throw new Error('네트워크 응답이 올바르지 않습니다.');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        let container = doc.querySelector('.se-main-container');
        if (!container) {
          container = doc.querySelector('#viewTypeSelector');
        }
        
        if (container) {
          data = {
            success: true,
            text: container.innerText || '',
            title: doc.title || currentTab.title,
            url: mobileUrl
          };
        } else {
          data = {
            success: false,
            error: '본문 영역을 찾을 수 없습니다.'
          };
        }
      }
      
      if (data && data.success) {
        const markdown = cleanAndFormatText(data.text, data.title, data.url);
        const copied = await copyToClipboard(markdown);
        if (copied) {
          showToast('📋 복사 완료! 노트북LM에 붙여넣으세요.');
        } else {
          showToast('클립보드 복사에 실패했습니다.', true);
        }
      } else if (data && !data.success) {
        alert(data.error);
      } else {
        showToast('본문을 추출할 수 없습니다.', true);
      }
    } catch (err) {
      console.error('Extraction failed:', err);
      showToast('텍스트 추출 중 오류가 발생했습니다.', true);
    } finally {
      copyBtn.disabled = false;
      copySpinner.style.display = 'none';
    }
  });

  // Batch Export & Download Event Handler
  batchBtn.addEventListener('click', async () => {
    batchBtn.disabled = true;
    batchSpinner.style.display = 'inline-block';
    
    try {
      const naverTabs = await chrome.tabs.query({
        url: ["*://m.blog.naver.com/*", "*://blog.naver.com/*"],
        currentWindow: true
      });
      if (naverTabs.length === 0) {
        showToast('추출할 네이버 블로그 탭이 없습니다.', true);
        return;
      }
      
      const results = [];
      for (const tab of naverTabs) {
        try {
          const parsedUrl = new URL(tab.url);
          if (parsedUrl.hostname === 'm.blog.naver.com') {
            // Mobile: inject script
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: extractNaverBlogText
            });
            
            if (result && result.result && result.result.success) {
              results.push(result.result);
            }
          } else {
            // PC: fetch mobile
            const mobileUrl = getMobileBlogUrl(tab.url);
            const response = await fetch(mobileUrl);
            if (response.ok) {
              const html = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              
              let container = doc.querySelector('.se-main-container');
              if (!container) {
                container = doc.querySelector('#viewTypeSelector');
              }
              
              if (container) {
                results.push({
                  success: true,
                  text: container.innerText || '',
                  title: doc.title || tab.title,
                  url: mobileUrl
                });
              }
            }
          }
        } catch (scriptErr) {
          console.error(`Failed extracting tab ${tab.id}:`, scriptErr);
        }
      }
      
      if (results.length === 0) {
        showToast('추출 성공한 본문이 없습니다.', true);
        return;
      }
      
      // Format each and join with Horizontal Rule
      const formattedDocs = results.map(res => cleanAndFormatText(res.text, res.title, res.url));
      const mergedContent = formattedDocs.join('\n\n---\n\n');
      
      // Download file
      const blob = new Blob([mergedContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const filename = `naver_blogs_batch_${dateStr}.txt`;
      
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      });
      
      // Cleanup Object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      
      showToast(`💾 ${results.length}개 블로그 일괄 다운로드 시작!`);
    } catch (err) {
      console.error('Batch export failed:', err);
      showToast('일괄 다운로드 중 오류가 발생했습니다.', true);
    } finally {
      batchBtn.disabled = false;
      batchSpinner.style.display = 'none';
    }
  });

  // --- Screenshot Full Page Feature ---
  const screenshotBtn = document.getElementById('screenshot-btn');
  const screenshotSpinner = document.getElementById('screenshot-spinner');
  const screenshotTarget = document.getElementById('screenshot-target');

  // Helper for delay
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  if (screenshotBtn) {
    // Show current tab URL name as target helper
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        screenshotTarget.textContent = tab.title ? (tab.title.substring(0, 30) + (tab.title.length > 30 ? '...' : '')) : '현재 탭';
      }
    } catch (e) {
      console.error(e);
    }

    screenshotBtn.addEventListener('click', async () => {
      screenshotBtn.disabled = true;
      screenshotSpinner.style.display = 'inline-block';
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          showToast('활성화된 탭을 찾을 수 없습니다.', true);
          return;
        }

        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
          alert('브라우저 설정 및 시스템 페이지는 캡처할 수 없습니다.');
          return;
        }

        if (tab.url.startsWith('file://')) {
          const isAllowed = await chrome.extension.isAllowedFileSchemeAccess();
          if (!isAllowed) {
            alert('로컬 파일(file://)을 캡처하려면 크롬 확장 프로그램 관리자(chrome://extensions)에서 이 확장 프로그램의 "파일 URL에 대한 액세스 허용" 옵션을 켜야 합니다.');
            return;
          }
        }

        showToast('📸 전체 스크롤 캡처 시작 (잠시 대기)...');

        // 1. Get page dimensions and current scroll positions
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
          throw new Error('페이지 크기를 측정하지 못했습니다.');
        }

        const dim = dimensionsResult.result;
        const totalHeight = dim.scrollHeight;
        const viewportHeight = dim.clientHeight;
        const viewportWidth = dim.clientWidth;
        const pixelRatio = dim.devicePixelRatio;

        const captures = [];
        const scrollPositions = [];
        let currentY = 0;

        // Hide scrollbar temporarily to make clean screenshot
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            document.body.style.overflow = 'hidden';
          }
        });

        // 2. Loop scroll & capture
        while (currentY < totalHeight) {
          // Adjust scroll position (cannot scroll past scrollHeight - clientHeight)
          const scrollY = Math.min(currentY, totalHeight - viewportHeight);
          scrollPositions.push(scrollY);

          // Scroll page
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [scrollY],
            func: (y) => {
              window.scrollTo(0, y);
            }
          });

          // Wait for rendering and lazy load images
          await sleep(250);

          // Capture visible tab
          const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
          captures.push(dataUrl);

          // Break if we've reached the bottom
          if (scrollY >= totalHeight - viewportHeight) {
            break;
          }
          currentY += viewportHeight;
        }

        // 3. Restore scrollbar and original position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [dim.originalX, dim.originalY],
          func: (ox, oy) => {
            document.body.style.overflow = '';
            window.scrollTo(ox, oy);
          }
        });

        // 4. Stitch images together on canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewportWidth * pixelRatio;
        canvas.height = totalHeight * pixelRatio;
        const ctx = canvas.getContext('2d');

        showToast('🧩 이미지 조각 병합 중...');

        // Load images sequentially and draw them
        for (let i = 0; i < captures.length; i++) {
          const dataUrl = captures[i];
          const scrollY = scrollPositions[i];
          
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              // Draw the screenshot onto the correct position
              ctx.drawImage(img, 0, scrollY * pixelRatio);
              resolve();
            };
            img.onerror = (err) => {
              reject(err);
            };
            img.src = dataUrl;
          });
        }

        // 5. Download the final image
        const mergedDataUrl = canvas.toDataURL('image/png');
        
        const sanitizeTitle = (tab.title || 'screenshot')
          .replace(/[\\/:*?"<>|]/g, '_')
          .substring(0, 30);
          
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const filename = `${sanitizeTitle}_full_${dateStr}.png`;

        await chrome.downloads.download({
          url: mergedDataUrl,
          filename: filename,
          saveAs: false
        });

        showToast('💾 캡처 파일 다운로드 시작!');
      } catch (err) {
        console.error('Screenshot failed:', err);
        showToast(`캡처 중 오류가 발생했습니다: ${err.message || err}`, true);
      } finally {
        screenshotBtn.disabled = false;
        screenshotSpinner.style.display = 'none';
      }
    });
  }

  // HTML Download Event Handler
  if (htmlSaveBtn) {
    htmlSaveBtn.addEventListener('click', async () => {
      if (!currentTab) return;
      
      htmlSaveBtn.disabled = true;
      htmlSaveSpinner.style.display = 'inline-block';
      
      try {
        // Inject script to get the whole page HTML
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: () => {
            return document.documentElement.outerHTML;
          }
        });
        
        if (result && result.result) {
          const htmlContent = `<!DOCTYPE html>\n${result.result}`;
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          
          const sanitizeTitle = (currentTab.title || 'webpage')
            .replace(/[\\/:*?"<>|]/g, '_')
            .substring(0, 30);
            
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;
          
          const filename = `${sanitizeTitle}_${dateStr}.html`;
          
          await chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
          });
          
          // Cleanup Object URL
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          showToast('💾 HTML 파일 다운로드 시작!');
        } else {
          showToast('HTML 소스를 가져오지 못했습니다.', true);
        }
      } catch (err) {
        console.error('HTML save failed:', err);
        showToast('HTML 저장 중 오류가 발생했습니다.', true);
      } finally {
        htmlSaveBtn.disabled = false;
        htmlSaveSpinner.style.display = 'none';
      }
    });
  }

  // PDF Download Event Handler
  if (pdfSaveBtn) {
    pdfSaveBtn.addEventListener('click', async () => {
      if (!currentTab) return;
      
      pdfSaveBtn.disabled = true;
      pdfSaveSpinner.style.display = 'inline-block';
      
      const sanitizeTitle = (currentTab.title || 'webpage')
        .replace(/[\\/:*?"<>|]/g, '_')
        .substring(0, 30);
        
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const filename = `${sanitizeTitle}_${dateStr}.pdf`;

      let pdfSaved = false;

      // 1. Try chrome.debugger Page.printToPDF
      try {
        await chrome.debugger.attach({ tabId: currentTab.id }, '1.3');
        const result = await chrome.debugger.sendCommand(
          { tabId: currentTab.id },
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
        await chrome.debugger.detach({ tabId: currentTab.id });

        if (result && result.data) {
          const dataUrl = `data:application/pdf;base64,${result.data}`;
          await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
          });
          showToast('📄 PDF 파일 다운로드 시작!');
          pdfSaved = true;
        }
      } catch (debuggerErr) {
        console.warn('chrome.debugger printToPDF failed, trying window.print() fallback:', debuggerErr);
        try {
          await chrome.debugger.detach({ tabId: currentTab.id });
        } catch (e) {}
      }

      // 2. Fallback to window.print() if debugger failed
      if (!pdfSaved) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
              window.print();
            }
          });
          showToast('🖨️ 인쇄/PDF 저장 창이 열렸습니다.');
        } catch (err) {
          console.error('PDF save failed:', err);
          showToast('PDF 저장 중 오류가 발생했습니다.', true);
        }
      }

      pdfSaveBtn.disabled = false;
      pdfSaveSpinner.style.display = 'none';
    });
  }

  // Image Downloader Event Handler
  if (imageDownloadBtn) {
    imageDownloadBtn.addEventListener('click', async () => {
      const urlsJson = imageDownloadBtn.dataset.urls;
      if (!urlsJson) {
        showToast('다운로드할 이미지가 없습니다.', true);
        return;
      }
      
      const urls = JSON.parse(urlsJson);
      if (urls.length === 0) {
        showToast('다운로드할 이미지가 없습니다.', true);
        return;
      }
      
      imageDownloadBtn.disabled = true;
      imageDownloadSpinner.style.display = 'inline-block';
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          showToast('활성화된 탭을 찾을 수 없습니다.', true);
          return;
        }
        
        const sanitizeTitle = (tab.title || 'images')
          .replace(/[\\/:*?"<>|]/g, '_')
          .substring(0, 30);
          
        showToast(`📂 총 ${urls.length}개 이미지 다운로드 시작...`);
        
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          
          // Determine extension
          let ext = 'jpg';
          if (url.includes('.png') || url.includes('type=png') || url.startsWith('data:image/png')) ext = 'png';
          else if (url.includes('.gif') || url.includes('type=gif') || url.startsWith('data:image/gif')) ext = 'gif';
          else if (url.includes('.webp') || url.includes('type=webp') || url.startsWith('data:image/webp')) ext = 'webp';
          else if (url.includes('.svg') || url.startsWith('data:image/svg')) ext = 'svg';
          
          const filename = `${sanitizeTitle}_img_${String(i + 1).padStart(3, '0')}.${ext}`;
          
          try {
            await chrome.downloads.download({
              url: url,
              filename: `NaverBlogExporter/${sanitizeTitle}_images/${filename}`,
              saveAs: false
            });
          } catch (dlErr) {
            console.error('Failed to download in folder, retrying at root:', dlErr);
            try {
              await chrome.downloads.download({
                url: url,
                saveAs: false
              });
            } catch (fallbackErr) {
              console.error('Total failure to download image:', url, fallbackErr);
            }
          }
          
          // Add a short delay to prevent throttling
          await sleep(150);
        }
        
        showToast('💾 모든 이미지 다운로드 요청 완료!');
      } catch (err) {
        console.error('Image downloader error:', err);
        showToast('이미지 다운로드 중 오류가 발생했습니다.', true);
      } finally {
        imageDownloadBtn.disabled = false;
        imageDownloadSpinner.style.display = 'none';
      }
    });
  }

  // --- Naver Cafe Exporter Feature ---
  // Helper to clean extracted cafe post text (remove empty lines & widget noise)
  function cleanCafeText(text) {
    if (!text) return '';
    const lines = text.split(/\r?\n/);
    const cleanedLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Skip Naver map widget boilerplate / noise lines
      if (trimmed.includes('NAVER Corp.') || 
          trimmed.includes('OpenStreetMap') || 
          trimmed.includes('지도 컨트롤러') || 
          trimmed.includes('범례부동산거리')) {
        continue;
      }
      
      cleanedLines.push(trimmed);
    }
    
    return cleanedLines.join('\n');
  }

  // Helper to fetch and parse cafe posts
  async function fetchAndExtractCafePosts() {
    const cafeTabs = await chrome.tabs.query({
      url: ["*://cafe.naver.com/*"],
      currentWindow: true
    });
    const validCafeTabs = cafeTabs.filter(tab => {
      if (!tab.url) return false;
      return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
    });

    if (validCafeTabs.length === 0) {
      throw new Error('추출할 네이버 카페 탭이 없습니다.');
    }

    const results = [];
    for (const tab of validCafeTabs) {
      try {
        // executeScript with allFrames: true to inject inside cafe_main iframe
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: () => {
            const titleElement = document.querySelector('.title_area .title_text') || document.querySelector('.ArticleTitle .title_text') || document.querySelector('.b-title');
            const contentElement = document.querySelector('.se-main-container') || document.querySelector('#ContentRenderer') || document.querySelector('.article_viewer');
            if (titleElement || contentElement) {
              const titleText = titleElement ? titleElement.textContent : '';
              const contentText = contentElement ? (contentElement.innerText || contentElement.textContent) : '';
              return {
                title: titleText,
                content: contentText
              };
            }
            return null;
          }
        });

        // Find the result from the iframe frame which actually has the elements
        let extracted = null;
        if (injectionResults && injectionResults.length > 0) {
          for (const res of injectionResults) {
            if (res.result && (res.result.title || res.result.content)) {
              extracted = res.result;
              break;
            }
          }
        }

        if (extracted) {
          const rawTitle = (extracted.title || '').trim() || '제목을 찾을 수 없습니다.';
          const cleanedContent = cleanCafeText(extracted.content);

          results.push({
            success: true,
            title: rawTitle,
            content: cleanedContent || '본문을 찾을 수 없습니다.',
            url: tab.url
          });
        } else {
          results.push({
            success: false,
            title: '추출 실패',
            content: '탭의 프레임에서 제목 또는 본문을 찾을 수 없습니다. (페이지가 로딩 중이거나 구조가 다를 수 있습니다.)',
            url: tab.url
          });
        }
      } catch (e) {
        console.error(`Failed extracting cafe tab ${tab.id}:`, e);
        results.push({
          success: false,
          title: '추출 실패',
          content: `탭 스크립트 실행 중 오류가 발생했습니다. (오류: ${e.message || e})`,
          url: tab.url
        });
      }
    }

    const formattedDocs = results.map(res => {
      return `==================================================
제목: ${res.title}
출처: ${res.url}
==================================================

${res.content}`;
    });

    return {
      text: formattedDocs.join('\n\n\n'),
      count: results.length
    };
  }

  if (cafeCopyBtn) {
    cafeCopyBtn.addEventListener('click', async () => {
      cafeCopyBtn.disabled = true;
      cafeCopySpinner.style.display = 'inline-block';

      try {
        const { text, count } = await fetchAndExtractCafePosts();
        const copied = await copyToClipboard(text);
        if (copied) {
          showToast(`📋 ${count}개 카페글 복사 완료!`);
        } else {
          showToast('클립보드 복사에 실패했습니다.', true);
        }
      } catch (err) {
        console.error('Cafe copy failed:', err);
        showToast(err.message || '텍스트 추출 중 오류가 발생했습니다.', true);
      } finally {
        cafeCopyBtn.disabled = false;
        cafeCopySpinner.style.display = 'none';
      }
    });
  }

  if (cafeSaveBtn) {
    cafeSaveBtn.addEventListener('click', async () => {
      cafeSaveBtn.disabled = true;
      cafeSaveSpinner.style.display = 'inline-block';

      try {
        const { text, count } = await fetchAndExtractCafePosts();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const filename = `naver_cafe_batch_${dateStr}.txt`;

        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        });

        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast(`💾 ${count}개 카페글 다운로드 시작!`);
      } catch (err) {
        console.error('Cafe save failed:', err);
        showToast(err.message || '파일 저장 중 오류가 발생했습니다.', true);
      } finally {
        cafeSaveBtn.disabled = false;
        cafeSaveSpinner.style.display = 'none';
      }
    });
  }
  
  // --- Auto Comment Feature Logic ---
  
  // Update UI match status details
  function updateCommentMatchStatus() {
    const commentKeys = Object.keys(parsedComments);
    const commentCount = commentKeys.length;
    
    commentMatchStatus.textContent = `감지된 카페 탭: ${detectedCafeTabsCount}개 / 입력할 댓글: ${commentCount}개`;
    
    if (commentCount > 0) {
      commentCountBadge.style.display = 'inline-block';
      commentCountBadge.textContent = `${commentCount}개 매칭`;
      
      if (detectedCafeTabsCount > 0) {
        commentAutoBtn.disabled = false;
      } else {
        commentAutoBtn.disabled = true;
      }
    } else {
      commentCountBadge.style.display = 'none';
      commentAutoBtn.disabled = true;
    }
  }

  // Parse and validate JSON comment input in real-time
  commentJsonInput.addEventListener('input', () => {
    const val = commentJsonInput.value.trim();
    if (!val) {
      parsedComments = {};
      commentJsonInput.style.borderColor = '';
      updateCommentMatchStatus();
      return;
    }
    
    let obj;
    try {
      // 1. Try parsing as strict JSON
      obj = JSON.parse(val);
    } catch (strictErr) {
      try {
        // 2. Try parsing as relaxed JSON (auto-quote keys and strip trailing commas)
        let relaxed = val;
        
        // Quote unquoted keys (e.g. key : "value")
        relaxed = relaxed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        
        // Quote single-quoted keys (e.g. 'key' : "value")
        relaxed = relaxed.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
        
        // Strip trailing commas before closing braces/brackets
        relaxed = relaxed.replace(/,\s*([}\]])/g, '$1');
        
        obj = JSON.parse(relaxed);
      } catch (relaxedErr) {
        parsedComments = {};
        commentJsonInput.style.borderColor = 'var(--danger)';
        commentCountBadge.style.display = 'none';
        commentAutoBtn.disabled = true;
        commentMatchStatus.textContent = '올바른 JSON 형식이 아닙니다 (작성 중...)';
        return;
      }
    }

    try {
      const cleaned = {};
      let index = 1;
      
      // Sort keys to maintain order txt1, txt2, etc., or standard object keys
      const keys = Object.keys(obj).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      });

      for (const key of keys) {
        if (typeof obj[key] === 'string') {
          cleaned[`txt${index}`] = obj[key];
          index++;
        }
      }
      
      parsedComments = cleaned;
      commentJsonInput.style.borderColor = 'var(--accent-naver)';
      updateCommentMatchStatus();
    } catch (e) {
      parsedComments = {};
      commentJsonInput.style.borderColor = 'var(--danger)';
      commentCountBadge.style.display = 'none';
      commentAutoBtn.disabled = true;
      commentMatchStatus.textContent = '데이터 처리 중 오류가 발생했습니다.';
    }
  });

  // Execute Batch Auto Comment
  commentAutoBtn.addEventListener('click', async () => {
    const commentKeys = Object.keys(parsedComments);
    const commentsList = commentKeys.map(k => parsedComments[k]);
    
    if (commentsList.length === 0) {
      showToast('입력할 댓글 내용이 없습니다.', true);
      return;
    }

    commentAutoBtn.disabled = true;
    commentAutoSpinner.style.display = 'inline-block';
    commentProgressStatus.style.display = 'block';
    commentProgressStatus.style.color = 'var(--text-sub)';
    commentProgressStatus.textContent = '카페 탭 조회 중...';
    
    // Disable inputs during processing
    commentJsonInput.disabled = true;
    commentAutoSubmit.disabled = true;
    commentDelay.disabled = true;
    if (cafeCopyBtn) cafeCopyBtn.disabled = true;
    if (cafeSaveBtn) cafeSaveBtn.disabled = true;
    
    try {
      const cafeTabs = await chrome.tabs.query({
        url: ["*://cafe.naver.com/*"],
        currentWindow: true
      });
      
      const validCafeTabs = cafeTabs.filter(tab => {
        if (!tab.url) return false;
        return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
      }).sort((a, b) => a.index - b.index);

      detectedCafeTabsCount = validCafeTabs.length;
      updateCommentMatchStatus();

      if (validCafeTabs.length === 0) {
        throw new Error('댓글을 입력할 네이버 카페 탭이 없습니다.');
      }

      const totalToProcess = Math.min(validCafeTabs.length, commentsList.length);
      commentProgressStatus.textContent = `댓글 자동 입력 시작 (대상 탭: ${totalToProcess}개)...`;
      
      let successCount = 0;
      
      for (let i = 0; i < totalToProcess; i++) {
        const tab = validCafeTabs[i];
        const commentText = commentsList[i];
        
        commentProgressStatus.textContent = `${i + 1}/${totalToProcess}번째 탭 댓글 입력 중...`;
        
        try {
          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: (text, autoRegister) => {
              const textarea = document.querySelector('.comment_inbox_text') || document.getElementById('comment_text');
              if (textarea) {
                textarea.value = text;
                
                // Dispatch input events
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                textarea.dispatchEvent(inputEvent);
                textarea.dispatchEvent(changeEvent);
                
                if (autoRegister) {
                  const registerBtn = document.querySelector('.comment_inbox .btn_register') || 
                                      document.querySelector('.btn_register') ||
                                      document.querySelector('#comment_register_button');
                  if (registerBtn) {
                    registerBtn.click();
                    return { success: true, submitted: true };
                  }
                  return { success: true, submitted: false, error: '등록 버튼을 찾을 수 없습니다.' };
                }
                return { success: true, submitted: false };
              }
              return null;
            },
            args: [commentText, commentAutoSubmit.checked]
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
          } else {
            console.warn(`Tab ${tab.id} does not have a comment inbox`);
          }
        } catch (injectErr) {
          console.error(`Failed to inject comment into tab ${tab.id}:`, injectErr);
        }
        
        // Configurable delay between entries
        const delaySec = parseFloat(commentDelay.value) || 5;
        if (i < totalToProcess - 1) {
          await sleep(delaySec * 1000);
        }
      }
      
      showToast(`💾 ${successCount}개 탭에 댓글 입력 완료!`);
      commentProgressStatus.style.color = 'var(--accent-naver)';
      commentProgressStatus.textContent = `입력 완료! (성공: ${successCount}/${totalToProcess}개)`;
      
    } catch (err) {
      console.error('Auto comment execution failed:', err);
      showToast(err.message || '댓글 자동 입력 중 오류가 발생했습니다.', true);
      commentProgressStatus.style.color = 'var(--danger)';
      commentProgressStatus.textContent = `실패: ${err.message || err}`;
    } finally {
      // Re-enable inputs
      commentAutoBtn.disabled = false;
      commentAutoSpinner.style.display = 'none';
      commentJsonInput.disabled = false;
      commentAutoSubmit.disabled = false;
      commentDelay.disabled = false;
      
      // Update UI counts
      const cafeTabs = await chrome.tabs.query({
        url: ["*://cafe.naver.com/*"],
        currentWindow: true
      });
      const validCafeTabs = cafeTabs.filter(tab => {
        if (!tab.url) return false;
        return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
      });
      detectedCafeTabsCount = validCafeTabs.length;
      if (cafeCopyBtn) cafeCopyBtn.disabled = (detectedCafeTabsCount === 0);
      if (cafeSaveBtn) cafeSaveBtn.disabled = (detectedCafeTabsCount === 0);
      
      updateCommentMatchStatus();
    }
  });

  // --- Tab Opener Feature Logic ---
  if (tabOpenerBtn) {
    tabOpenerBtn.addEventListener('click', async () => {
      const template = tabOpenerTemplate.value.trim();
      const start = parseInt(tabOpenerStart.value);
      const end = parseInt(tabOpenerEnd.value);
      
      if (!template) {
        showToast('URL 템플릿을 입력해주세요.', true);
        return;
      }
      
      if (!template.includes('[NUM]')) {
        showToast('템플릿 URL에 [NUM]을 포함해야 합니다.', true);
        return;
      }
      
      if (isNaN(start) || isNaN(end)) {
        showToast('올바른 범위를 입력해주세요.', true);
        return;
      }
      
      if (start > end) {
        showToast('시작 번호가 끝 번호보다 클 수 없습니다.', true);
        return;
      }
      
      const count = end - start + 1;
      if (count > 50) {
        showToast('한 번에 최대 50개까지만 열 수 있습니다.', true);
        return;
      }
      
      tabOpenerBtn.disabled = true;
      if (tabOpenerSpinner) tabOpenerSpinner.style.display = 'inline-block';
      
      try {
        showToast(`📂 ${count}개 탭 여는 중...`);
        
        for (let i = start; i <= end; i++) {
          const url = template.replace('[NUM]', i);
          await chrome.tabs.create({
            url: url,
            active: false // Open in background to prevent flashing/focus loss
          });
          // Wait 80ms to avoid freezing browser tab creation queue
          await sleep(80);
        }
        
        showToast(`🎉 ${count}개 탭이 성공적으로 열렸습니다!`);
        
        // Refresh Cafe counts in the extension
        setTimeout(async () => {
          const cafeTabs = await chrome.tabs.query({
            url: ["*://cafe.naver.com/*"],
            currentWindow: true
          });
          const validCafeTabs = cafeTabs.filter(tab => {
            if (!tab.url) return false;
            return /\/cafes\/\d+\/articles\/\d+/.test(tab.url);
          });
          
          if (cafeCount) {
            cafeCount.textContent = `${validCafeTabs.length}개 탭 감지됨`;
          }
          if (cafeCopyBtn) {
            cafeCopyBtn.disabled = (validCafeTabs.length === 0);
          }
          if (cafeSaveBtn) {
            cafeSaveBtn.disabled = (validCafeTabs.length === 0);
          }
          
          detectedCafeTabsCount = validCafeTabs.length;
          updateCommentMatchStatus();
        }, 1000);
        
      } catch (err) {
        console.error('Tab opener failed:', err);
        showToast('탭을 여는 중 오류가 발생했습니다.', true);
      } finally {
        tabOpenerBtn.disabled = false;
        if (tabOpenerSpinner) tabOpenerSpinner.style.display = 'none';
      }
    });
  }
});
