document.addEventListener('DOMContentLoaded', async () => {
  const activeTitle = document.getElementById('active-title');
  const activeUrl = document.getElementById('active-url');
  const activeStatusBadge = document.getElementById('active-status-badge');
  const copyBtn = document.getElementById('copy-btn');
  const copySpinner = document.getElementById('copy-spinner');
  
  const batchCount = document.getElementById('batch-count');
  const batchWebCount = document.getElementById('batch-web-count');
  const batchBtn = document.getElementById('batch-btn');
  const batchSpinner = document.getElementById('batch-spinner');
  const batchHtmlBtn = document.getElementById('batch-html-btn');
  const batchHtmlSpinner = document.getElementById('batch-html-spinner');
  const batchHtmlBtnText = document.getElementById('batch-html-btn-text');
  
  const htmlSaveBtn = document.getElementById('html-save-btn');
  const htmlSaveSpinner = document.getElementById('html-save-spinner');
  const pdfSaveBtn = document.getElementById('pdf-save-btn');
  const pdfSaveSpinner = document.getElementById('pdf-save-spinner');

  const imageCount = document.getElementById('image-count');
  const imageDownloadBtn = document.getElementById('image-download-btn');
  const imageDownloadSpinner = document.getElementById('image-download-spinner');

  const cafeCount = document.getElementById('cafe-count');
  const cafeIncludePrompt = document.getElementById('cafe-include-prompt');
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
  const commentAutoIcon = document.getElementById('comment-auto-icon');
  const commentAutoBtnText = document.getElementById('comment-auto-btn-text');
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

  // Load last active tab & prompt checkbox from storage on startup
  try {
    chrome.storage.local.get(['activeTab', 'cafeIncludePrompt'], (result) => {
      if (result && result.activeTab === 'cafe') {
        switchTab('cafe');
      } else {
        switchTab('blog');
      }
      if (cafeIncludePrompt && result && typeof result.cafeIncludePrompt === 'boolean') {
        cafeIncludePrompt.checked = result.cafeIncludePrompt;
      }
    });
  } catch (e) {
    console.error('Failed to load active tab from storage:', e);
    switchTab('blog');
  }

  if (cafeIncludePrompt) {
    cafeIncludePrompt.addEventListener('change', () => {
      try {
        chrome.storage.local.set({ cafeIncludePrompt: cafeIncludePrompt.checked });
      } catch (e) {
        console.error(e);
      }
    });
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
        if (htmlSaveBtn) htmlSaveBtn.disabled = false;
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
        if (htmlSaveBtn) htmlSaveBtn.disabled = true;
        pdfSaveBtn.disabled = true;
        imageCount.textContent = '지원 불가 페이지';
      }
    } else {
      activeStatusBadge.textContent = '탭 정보 없음';
      activeStatusBadge.className = 'badge badge-error';
      copyBtn.disabled = true;
      if (htmlSaveBtn) htmlSaveBtn.disabled = true;
      pdfSaveBtn.disabled = true;
      imageCount.textContent = '탭 정보 없음';
    }
    
    // 2. Count open Naver Blog tabs for Batch Mode
    const naverTabs = await chrome.tabs.query({
      url: ["*://m.blog.naver.com/*", "*://blog.naver.com/*"],
      currentWindow: true
    });
    batchCount.textContent = `${naverTabs.length}개 감지됨`;
    batchBtn.disabled = naverTabs.length === 0;

    // Count all regular webpage tabs for Batch HTML Mode
    const allTabsInWindow = await chrome.tabs.query({ currentWindow: true });
    const validWebTabs = allTabsInWindow.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
    if (batchWebCount) {
      batchWebCount.textContent = `${validWebTabs.length}개 감지됨`;
    }
    if (batchHtmlBtn) {
      batchHtmlBtn.disabled = validWebTabs.length === 0;
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

  // Listen for background progress updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'BATCH_SAVE_HTML_PROGRESS') {
      if (batchHtmlBtnText) {
        batchHtmlBtnText.textContent = `[${msg.current}/${msg.total}] ${msg.status === 'downloaded' ? '완료' : '저장 중'}`;
      }
      if (msg.status === 'downloaded') {
        showToast(`💾 [${msg.current}/${msg.total}] 다운로드 완료: ${msg.title}`);
      } else {
        showToast(`⏳ [${msg.current}/${msg.total}] 수집 중: ${msg.title}`);
      }
    } else if (msg.type === 'BATCH_SAVE_HTML_COMPLETE') {
      if (batchHtmlBtnText) {
        batchHtmlBtnText.textContent = 'HTML 일괄 저장';
      }
      if (batchHtmlBtn) batchHtmlBtn.disabled = false;
      if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'none';
      showToast(`🎉 총 ${msg.saved}개 탭 파일 다운로드 완료!`);
    }
  });

  // Batch HTML (SingleFile) Download Event Handler
  if (batchHtmlBtn) {
    batchHtmlBtn.addEventListener('click', async () => {
      try {
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const validWebTabs = allTabs.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
        
        if (validWebTabs.length === 0) {
          showToast('저장할 일반 웹페이지 탭이 없습니다.', true);
          return;
        }

        batchHtmlBtn.disabled = true;
        batchHtmlSpinner.style.display = 'inline-block';
        if (batchHtmlBtnText) {
          batchHtmlBtnText.textContent = `[0/${validWebTabs.length}] 시작...`;
        }
        showToast(`🚀 ${validWebTabs.length}개 탭 일괄 저장을 시작합니다...`);

        const resp = await chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_HTML_TABS',
          tabIds: validWebTabs.map(t => t.id)
        });

        if (resp && resp.success) {
          showToast(`🎉 총 ${resp.saved}개 탭 저장 완료!`);
        } else {
          showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
        }
      } catch (err) {
        console.error('Batch HTML save failed:', err);
        showToast('일괄 저장 중 오류가 발생했습니다.', true);
      } finally {
        batchHtmlBtn.disabled = false;
        batchHtmlSpinner.style.display = 'none';
        if (batchHtmlBtnText) {
          batchHtmlBtnText.textContent = 'HTML 일괄 저장';
        }
      }
    });
  }

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

  // Safe capture helper with retry backoff to avoid MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota
  const safeCaptureVisibleTab = async (windowId = null, options = { format: 'png' }, maxRetries = 4) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await chrome.tabs.captureVisibleTab(windowId, options);
      } catch (err) {
        const isQuotaErr = err?.message && err.message.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
        if (isQuotaErr && attempt < maxRetries - 1) {
          // Wait before retrying (600ms, 900ms, 1200ms)
          await sleep(600 + attempt * 300);
          continue;
        }
        throw err;
      }
    }
  };

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

          // Wait for rendering and lazy load images (>=600ms to stay within Chrome capture quota)
          await sleep(600);

          // Capture visible tab safely with quota backoff retry
          const dataUrl = await safeCaptureVisibleTab(null, { format: 'png' });
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
        showToast('🧩 이미지 조각 병합 중...');

        // Load all captured image parts to get exact physical dimensions
        const loadedImages = await Promise.all(
          captures.map((dataUrl) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('이미지 조각 로드 실패: ' + e));
            img.src = dataUrl;
          }))
        );

        if (loadedImages.length === 0) {
          throw new Error('캡처된 이미지가 없습니다.');
        }

        const firstImg = loadedImages[0];
        // Calculate exact scale from the first captured image to prevent any sub-pixel blur
        const actualScale = firstImg.naturalWidth / viewportWidth;
        const finalWidth = firstImg.naturalWidth;
        const finalHeight = Math.round(totalHeight * actualScale);

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Maintain 1:1 crisp pixel sharpness (prevent blurring interpolation)
        ctx.imageSmoothingEnabled = false;

        // Draw each screenshot piece onto canvas with exact integer coordinates
        for (let i = 0; i < loadedImages.length; i++) {
          const img = loadedImages[i];
          const scrollY = scrollPositions[i];
          const drawY = Math.round(scrollY * actualScale);

          ctx.drawImage(
            img,
            0, 0, img.naturalWidth, img.naturalHeight,
            0, drawY, img.naturalWidth, img.naturalHeight
          );
        }

        // 5. Download the final image using high-quality Blob (avoids toDataURL memory/compression limits)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
          throw new Error('캔버스 이미지 생성 실패 (메모리 부족 가능성)');
        }
        const blobUrl = URL.createObjectURL(blob);
        
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
          url: blobUrl,
          filename: filename,
          saveAs: false
        });

        // Revoke blob URL after download starts
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

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

  // HTML Download Event Handler (SingleFile Complete Inliner Engine)
  if (htmlSaveBtn) {
    htmlSaveBtn.addEventListener('click', async () => {
      if (!currentTab) return;
      
      htmlSaveBtn.disabled = true;
      htmlSaveSpinner.style.display = 'inline-block';
      showToast('🎨 SingleFile 생성 시작: 스타일 & 이미지 수집 중...');
      
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: async () => {
            // Toast notification inside the web page
            const showWebToast = (msg, isErr = false) => {
              let t = document.getElementById('__singlefile_toast');
              if (!t) {
                t = document.createElement('div');
                t.id = '__singlefile_toast';
                t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:rgba(24,24,27,0.92);color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;backdrop-filter:blur(4px);transition:opacity 0.3s;';
                document.body.appendChild(t);
              }
              t.style.background = isErr ? 'rgba(220,38,38,0.92)' : 'rgba(24,24,27,0.92)';
              t.textContent = msg;
              t.style.opacity = '1';
              if (isErr) setTimeout(() => { if (t) t.style.opacity = '0'; }, 4000);
            };

            const removeWebToast = () => {
              const t = document.getElementById('__singlefile_toast');
              if (t) {
                t.style.opacity = '0';
                setTimeout(() => t.remove(), 400);
              }
            };

            try {
              showWebToast('📦 단일 HTML 생성 중: 문서 복제 및 정리...');

              // 1. Clone document
              const docClone = document.documentElement.cloneNode(true);

              // 2. Remove scripts and unwanted elements to prevent offline re-execution/redirection
              docClone.querySelectorAll('script, noscript, template').forEach(el => el.remove());

              // Ensure UTF-8 meta charset
              let head = docClone.querySelector('head');
              if (!head) {
                head = document.createElement('head');
                docClone.insertBefore(head, docClone.firstChild);
              }
              let metaCharset = head.querySelector('meta[charset]');
              if (!metaCharset) {
                metaCharset = document.createElement('meta');
                metaCharset.setAttribute('charset', 'utf-8');
                head.insertBefore(metaCharset, head.firstChild);
              }

              // Convert relative <a> links to absolute
              docClone.querySelectorAll('a[href]').forEach(a => {
                try {
                  a.href = a.href;
                } catch (e) {}
              });

              // Helper: Process CSS url(...) to Base64
              const processCssUrls = async (css, baseUrl) => {
                if (!css) return '';
                const urlRegex = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
                const matches = [];
                let match;
                while ((match = urlRegex.exec(css)) !== null) {
                  const rawUrl = match[2].trim();
                  if (rawUrl && !rawUrl.startsWith('data:') && !rawUrl.startsWith('#')) {
                    matches.push(rawUrl);
                  }
                }

                const uniqueUrls = [...new Set(matches)].slice(0, 40);
                const urlMap = new Map();

                await Promise.all(uniqueUrls.map(async (u) => {
                  try {
                    const absUrl = new URL(u, baseUrl).href;
                    const resp = await chrome.runtime.sendMessage({ type: 'FETCH_RESOURCE_AS_DATA_URL', url: absUrl });
                    if (resp && resp.success && resp.dataUrl) {
                      urlMap.set(u, resp.dataUrl);
                    }
                  } catch (e) {}
                }));

                return css.replace(urlRegex, (fullMatch, quote, rawUrl) => {
                  const clean = rawUrl.trim();
                  if (urlMap.has(clean)) {
                    return `url("${urlMap.get(clean)}")`;
                  }
                  try {
                    return `url("${new URL(clean, baseUrl).href}")`;
                  } catch (e) {
                    return fullMatch;
                  }
                });
              };

              // 3. Inline External Stylesheets (<link rel="stylesheet">)
              showWebToast('🎨 외부 스타일시트(CSS) 및 폰트 인라인화 중...');
              const linkTags = Array.from(document.querySelectorAll('link[rel~="stylesheet"]'));
              const linkCloneTags = Array.from(docClone.querySelectorAll('link[rel~="stylesheet"]'));

              for (let i = 0; i < linkTags.length; i++) {
                const origLink = linkTags[i];
                const cloneLink = linkCloneTags[i];
                if (!cloneLink) continue;

                const href = origLink.href;
                if (!href) continue;

                let cssText = '';
                try {
                  const sheet = Array.from(document.styleSheets).find(s => s.href === href);
                  if (sheet && sheet.cssRules) {
                    cssText = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
                  }
                } catch (e) {}

                if (!cssText) {
                  try {
                    const resp = await chrome.runtime.sendMessage({ type: 'FETCH_RESOURCE_AS_TEXT', url: href });
                    if (resp && resp.success && resp.text) {
                      cssText = resp.text;
                    }
                  } catch (e) {}
                }

                if (cssText) {
                  cssText = await processCssUrls(cssText, href);
                  const styleTag = document.createElement('style');
                  styleTag.setAttribute('data-original-href', href);
                  styleTag.textContent = cssText;
                  cloneLink.replaceWith(styleTag);
                }
              }

              // Process existing <style> tags
              const existingStyles = Array.from(docClone.querySelectorAll('style'));
              for (const style of existingStyles) {
                if (style.textContent && style.textContent.includes('url(')) {
                  style.textContent = await processCssUrls(style.textContent, document.baseURI);
                }
              }

              // 4. Inline Images (<img>)
              showWebToast('🖼️ 이미지 Base64 변환 및 인라인화 중...');
              const origImgs = Array.from(document.querySelectorAll('img'));
              const cloneImgs = Array.from(docClone.querySelectorAll('img'));

              const CHUNK_SIZE = 12;
              for (let i = 0; i < origImgs.length; i += CHUNK_SIZE) {
                const sliceOrig = origImgs.slice(i, i + CHUNK_SIZE);
                const sliceClone = cloneImgs.slice(i, i + CHUNK_SIZE);

                await Promise.all(sliceOrig.map(async (orig, idx) => {
                  const clone = sliceClone[idx];
                  if (!clone) return;

                  let src = orig.currentSrc || orig.src || orig.getAttribute('data-src') || orig.getAttribute('data-lazy-src') || orig.getAttribute('data-original');
                  if (!src || src.startsWith('data:')) {
                    clone.removeAttribute('srcset');
                    clone.removeAttribute('loading');
                    return;
                  }

                  try {
                    src = new URL(src, document.baseURI).href;
                  } catch (e) {}

                  let dataUrl = null;

                  // Try fast canvas conversion first if image is already loaded
                  if (orig.complete && orig.naturalWidth > 0 && orig.naturalHeight > 0) {
                    try {
                      const canvas = document.createElement('canvas');
                      canvas.width = orig.naturalWidth;
                      canvas.height = orig.naturalHeight;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(orig, 0, 0);
                      dataUrl = canvas.toDataURL('image/png');
                    } catch (e) {
                      // Tainted canvas -> fallback to background fetch
                    }
                  }

                  if (!dataUrl) {
                    try {
                      const resp = await chrome.runtime.sendMessage({ type: 'FETCH_RESOURCE_AS_DATA_URL', url: src });
                      if (resp && resp.success && resp.dataUrl) {
                        dataUrl = resp.dataUrl;
                      }
                    } catch (e) {}
                  }

                  if (dataUrl) {
                    clone.src = dataUrl;
                  } else {
                    clone.src = src;
                  }
                  clone.removeAttribute('srcset');
                  clone.removeAttribute('loading');
                }));
              }

              // 5. Inline background images in style attributes
              const elementsWithInlineStyle = Array.from(docClone.querySelectorAll('[style*="url("]'));
              for (const el of elementsWithInlineStyle) {
                const currentStyle = el.getAttribute('style');
                if (currentStyle) {
                  el.setAttribute('style', await processCssUrls(currentStyle, document.baseURI));
                }
              }

              // 6. Build Final HTML & Trigger Client Download
              showWebToast('💾 SingleFile 저장 및 다운로드 시작!');
              const finalHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;
              const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
              const blobUrl = URL.createObjectURL(blob);

              const sanitizeTitle = (document.title || 'webpage')
                .replace(/[\\/:*?"<>|]/g, '_')
                .substring(0, 30);
              const today = new Date();
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const filename = `${sanitizeTitle}_${dateStr}.html`;

              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                removeWebToast();
              }, 5000);

              return { success: true, filename };
            } catch (err) {
              showWebToast(`❌ SingleFile 저장 실패: ${err.message}`, true);
              throw err;
            }
          }
        });

        if (result && result.result && result.result.success) {
          showToast(`💾 SingleFile (${result.result.filename}) 저장 완료!`);
        } else {
          showToast('HTML 소스를 가져오지 못했습니다.', true);
        }
      } catch (err) {
        console.error('HTML SingleFile save failed:', err);
        showToast('SingleFile 저장 중 오류가 발생했습니다.', true);
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

        let finalText = text;
        if (cafeIncludePrompt && cafeIncludePrompt.checked) {
          const promptHeader = `[중요] 이전 대화나 이전에 전달된 글 내용은 모두 잊어줘. 지금 새로 입력하는 아래 ${count}개의 글에 대해서만 댓글을 작성해줘.\n\n`;
          finalText = promptHeader + text;
        }

        const copied = await copyToClipboard(finalText);
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

  // Helper to parse and update comment JSON state
  function processCommentJson(val) {
    if (!val) {
      parsedComments = {};
      commentJsonInput.style.borderColor = '';
      updateCommentMatchStatus();
      return;
    }
    
    let obj;
    try {
      obj = JSON.parse(val);
    } catch (strictErr) {
      try {
        let relaxed = val;
        relaxed = relaxed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        relaxed = relaxed.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
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
  }

  // Apply UI state from background auto-comment worker
  function applyAutoCommentUIState(state) {
    if (!state) return;

    if (state.isRunning) {
      // Toggle button to Stop mode
      commentAutoBtn.disabled = false;
      commentAutoBtn.className = 'btn btn-danger';
      if (commentAutoIcon) {
        commentAutoIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" fill="currentColor"></rect>';
      }
      if (commentAutoBtnText) {
        commentAutoBtnText.textContent = '일괄 입력 중지 (Stop)';
      }
      
      commentAutoSpinner.style.display = 'inline-block';
      commentProgressStatus.style.display = 'block';
      commentProgressStatus.style.color = state.statusColor || 'var(--text-sub)';
      commentProgressStatus.textContent = state.statusText || '댓글 자동 입력 진행 중...';
      
      commentJsonInput.disabled = true;
      commentAutoSubmit.disabled = true;
      commentDelay.disabled = true;
      if (cafeCopyBtn) cafeCopyBtn.disabled = true;
      if (cafeSaveBtn) cafeSaveBtn.disabled = true;
    } else {
      // Restore button to Start mode
      commentAutoBtn.className = 'btn btn-primary';
      if (commentAutoIcon) {
        commentAutoIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      }
      if (commentAutoBtnText) {
        commentAutoBtnText.textContent = '댓글 일괄 자동 입력 실행';
      }

      commentAutoSpinner.style.display = 'none';
      commentJsonInput.disabled = false;
      commentAutoSubmit.disabled = false;
      commentDelay.disabled = false;
      
      if (cafeCopyBtn) cafeCopyBtn.disabled = (detectedCafeTabsCount === 0);
      if (cafeSaveBtn) cafeSaveBtn.disabled = (detectedCafeTabsCount === 0);
      
      updateCommentMatchStatus();
      
      if (state.finished && state.statusText) {
        commentProgressStatus.style.display = 'block';
        commentProgressStatus.style.color = state.statusColor || 'var(--accent-naver)';
        commentProgressStatus.textContent = state.statusText;
      }
    }
  }

  // Restore saved input values & background state on load
  chrome.storage.local.get([
    'savedCommentJson', 
    'savedCommentAutoSubmit', 
    'savedCommentDelay',
    'savedTabOpenerTemplate',
    'savedTabOpenerStart',
    'savedTabOpenerEnd',
    'autoCommentState'
  ], (res) => {
    if (res.savedCommentJson !== undefined) {
      commentJsonInput.value = res.savedCommentJson;
      processCommentJson(res.savedCommentJson.trim());
    }
    if (res.savedCommentAutoSubmit !== undefined) {
      commentAutoSubmit.checked = res.savedCommentAutoSubmit;
    }
    if (res.savedCommentDelay !== undefined) {
      commentDelay.value = res.savedCommentDelay;
    }
    if (tabOpenerTemplate && res.savedTabOpenerTemplate !== undefined) {
      tabOpenerTemplate.value = res.savedTabOpenerTemplate;
    }
    if (tabOpenerStart && res.savedTabOpenerStart !== undefined) {
      tabOpenerStart.value = res.savedTabOpenerStart;
    }
    if (tabOpenerEnd && res.savedTabOpenerEnd !== undefined) {
      tabOpenerEnd.value = res.savedTabOpenerEnd;
    }
    
    // Restore running status if background task is active
    if (res.autoCommentState) {
      applyAutoCommentUIState(res.autoCommentState);
    }
  });

  // Listen to background progress updates in real-time
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTO_COMMENT_STATE_UPDATE') {
      applyAutoCommentUIState(message.state);
    }
  });

  // Save comment inputs on user change
  commentJsonInput.addEventListener('input', () => {
    const val = commentJsonInput.value;
    chrome.storage.local.set({ savedCommentJson: val });
    processCommentJson(val.trim());
  });

  commentAutoSubmit.addEventListener('change', () => {
    chrome.storage.local.set({ savedCommentAutoSubmit: commentAutoSubmit.checked });
  });

  commentDelay.addEventListener('input', () => {
    chrome.storage.local.set({ savedCommentDelay: commentDelay.value });
  });

  if (tabOpenerTemplate) {
    tabOpenerTemplate.addEventListener('input', () => {
      chrome.storage.local.set({ savedTabOpenerTemplate: tabOpenerTemplate.value });
    });
  }
  if (tabOpenerStart) {
    tabOpenerStart.addEventListener('input', () => {
      chrome.storage.local.set({ savedTabOpenerStart: tabOpenerStart.value });
    });
  }
  if (tabOpenerEnd) {
    tabOpenerEnd.addEventListener('input', () => {
      chrome.storage.local.set({ savedTabOpenerEnd: tabOpenerEnd.value });
    });
  }

  // Execute or Stop Batch Auto Comment
  commentAutoBtn.addEventListener('click', async () => {
    // If currently running, send stop request
    if (commentAutoBtn.classList.contains('btn-danger')) {
      commentAutoBtn.disabled = true;
      if (commentAutoBtnText) {
        commentAutoBtnText.textContent = '중지 요청 중...';
      }
      commentProgressStatus.textContent = '작업 중지 요청 중...';
      
      chrome.runtime.sendMessage({ type: 'STOP_AUTO_COMMENT' }, (res) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send stop message:', chrome.runtime.lastError);
        }
        showToast('⏹️ 댓글 자동 입력 중지를 요청했습니다.');
      });
      return;
    }

    // Start auto comment
    const commentKeys = Object.keys(parsedComments);
    const commentsList = commentKeys.map(k => parsedComments[k]);
    
    if (commentsList.length === 0) {
      showToast('입력할 댓글 내용이 없습니다.', true);
      return;
    }

    const autoSubmit = commentAutoSubmit.checked;
    const delaySec = parseFloat(commentDelay.value) || 5;

    // Immediate UI feedback
    applyAutoCommentUIState({
      isRunning: true,
      statusText: '백그라운드 작업 시작 중...',
      statusColor: 'var(--text-sub)'
    });

    // Send task to Background Service Worker
    chrome.runtime.sendMessage({
      type: 'START_AUTO_COMMENT',
      payload: {
        commentsList,
        autoSubmit,
        delaySec
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send auto comment task to background:', chrome.runtime.lastError);
        showToast('작업 시작 실패: ' + chrome.runtime.lastError.message, true);
        applyAutoCommentUIState({
          isRunning: false,
          statusText: '작업 시작 실패',
          statusColor: 'var(--danger)',
          finished: true
        });
      } else {
        showToast('🚀 백그라운드에서 댓글 입력이 시작되었습니다.');
      }
    });
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
      if (count > 80) {
        alert(`한 번에 최대 80개까지만 열 수 있습니다. (현재 요청: ${count}개)\n브라우저 멈춤 및 네이버 차단 방지를 위해 80개 이하로 범위를 지정해주세요.`);
        showToast('⚠️ 한 번에 최대 80개까지만 열 수 있습니다.', true);
        return;
      }
      
      tabOpenerBtn.disabled = true;
      if (tabOpenerSpinner) tabOpenerSpinner.style.display = 'inline-block';
      
      try {
        let openedCount = 0;
        showToast(`📂 ${count}개 탭 여는 중... (0/${count})`);
        
        for (let i = start; i <= end; i++) {
          const url = template.replace('[NUM]', i);
          await chrome.tabs.create({
            url: url,
            active: false // Open in background to prevent flashing/focus loss
          });
          openedCount++;
          
          showToast(`📂 탭 여는 중... (${openedCount}/${count})`);

          // 10개 열릴 때마다 3초 대기하여 브라우저/네이버 과부하 방지 (마지막 탭 제외)
          if (openedCount % 10 === 0 && i < end) {
            showToast(`⏳ 10개 오픈 완료. 안정성을 위해 2초 대기 중... (${openedCount}/${count})`);
            await sleep(2000);
          } else {
            // 기본 탭 생성 간격 150ms
            await sleep(150);
          }
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

  // ── GEMS Guide Copy ──
  const gemsGuideCopyBtn = document.getElementById('gems-guide-copy-btn');
  const GEMS_GUIDE_TEXT = `# [GEMS 지침서] 다이렉트결혼준비 댓글교류 어시스턴트

당신은 다이렉트결혼준비 카페의 회원간 댓글교류 포인트 활동을 도와주는 어시스턴트입니다.
매일 댓글 10개 이상(각 10자 이상)을 달면 1,000점을 적립할 수 있으며, 월 최대 10일, 10,000점까지 적립 가능합니다.

---

## 1. 댓글교류 규정 (반드시 준수)
- 수량 및 글자수: 하루에 댓글 10개 이상 필요, 댓글 1개당 10자 이상 (이모티콘, 특수문자는 글자수 불인정)
- 포함 제외: 대댓글, 본인 글에 단 댓글은 개수에서 제외
- 다양성: 여러 게시판에서 다양하게 작성해야 함
- 신청 및 적립 기간: 다음 달 1일 이후에 전월 활동분 신청 가능, 예식 완료 후 최대 2년까지 적립 가능

---

## 2. 절대 금지 댓글 유형 (미준수 시 포인트 거절)
- "축하드려요", "축하드립니다", "예쁘네요", "예쁘시네요", "맛있어보여요", "큰산 넘으셨네요"
- 위와 비슷한 짧고 반복적인 댓글
- 타인의 댓글을 복사하거나 약간만 수정한 댓글
- 내용을 읽지 않고 쓸 수 있는 성의 없는 댓글
- "답방 가요", "댓글 약속" 등의 품앗이 유도 문구

---

## 3. 핵심 작성 원칙 (AI 티 안 내기 & 사람처럼 쓰기)
- **구체적인 키워드 매칭:** 글쓴이가 언급한 구체적인 지명, 브랜드명, 감정 표현, 에피소드 단어를 댓글에 반드시 녹여내어 '진짜 읽고 쓴 느낌'을 줍니다.
- **자연스러운 구어체와 신조어/자음 활용:** "~인 것 같아요 ㅎㅎ", "ㅠㅠ", 완전 공감해요", "꿀팁이네요!" 등 실제 카페 회원들이 자주 쓰는 부드럽고 친근한 모바일 말투를 구사합니다. (단, 기계적인 반복 금지)
- **문장 내 줄바꿈 반영:** 가독성을 위해 문장 중간 자연스러운 위치에 줄바꿈을 적용하되, JSON 포맷 깨짐 방지를 위해 반드시 \\n 문자로 표시합니다.

---

## 4. 사용자 대화 모드 및 출력 양식

### 모드 1: 카페 글 내용 공유 ➔ 댓글 초안 제공
사용자가 카페 글 내용을 붙여넣으면 글 내용을 파악하여 진짜로 반응하는 맞춤형 댓글 초안 3가지를 작성합니다.
- 초안A (공감형): 글쓴이 상황과 감정에 격하게 공감하는 내용 (줄바꿈 \\n 포함, 20자 이상)
- 초안B (정보공유형): 관련 경험, 팁을 나누거나 조언하는 내용 (줄바꿈 \\n 포함, 20자 이상)
- 초안C (질문형): 글 내용과 관련된 디테일을 자연스럽게 묻는 내용 (줄바꿈 \\n 포함, 20자 이상)

※ 출력 시 하단에 다음 주의 문구를 필수로 포함합니다:
"⚠️ 그대로 복붙 금지! 본인 말투로 조금 바꿔서 사용하세요. 같은 표현을 여러 게시글에 반복하면 거절될 수 있어요."

---

### ⭐ 모드 2: 오늘 댓글 빠르게 완성 (JSON 출력형 - 핵심 기능)
사용자가 "오늘 댓글 N개 채워줘"라고 하거나, 여러 개의 카페 게시글 제목/본문을 한꺼번에 제공할 경우, 사용자가 원클릭으로 바로 복사해서 쓸 수 있도록 마크다운 코드 블록 안에 깔끔한 JSON 형식으로 최종 답변을 출력합니다.

[출력 및 작성 규칙]
1. 사용자가 제공한 글의 개수나 요청한 수량(N개)에 맞춰 \`txt1\`부터 \`txtN\`까지 동적으로 JSON을 구성합니다. (개수 제한 없음)
2. 각 댓글은 반드시 공백 제외 10자 이상(안전하게 20~50자 사이 권장)으로 작성합니다.
3. 문장 중간에 가독성을 위한 줄바꿈을 넣고, 반드시 \\n으로 표기합니다.
4. AI 특유의 정형화된 어조("~해보시는 것을 추천합니다", "~라는 생각이 듭니다")를 절대 금지하고, 실제 예신/예랑이가 쓰는 말투로 작성합니다.

[JSON 출력 양식 예시]
\`\`\`json
{
  "txt1": "결혼 준비하다 보면 진짜 숨만 쉬어도 돈 나가는 기분이죠 ㅠㅠ\\n주식까지 속상하게 하면 더 힘 빠지실 텐데 우리 같이 힘내서 예산 아껴봐요 화이팅!",
  "txt2": "엘블레스가 베뉴시라면 홀 분위기 잘 아는 작가님이 진짜 최고예요!\\n인스타 피드 톤이 마음에 쏙 드셨다니 당일에 인생 사진 가득 건지실 것 같아요 ㅎㅎ",
  "txt3": "세 시간이나 묵묵히 기다려준 남편분 진짜 다정하고 스윗하시네요..\\n회사 때문에 속상했던 마음 남편분 얼굴 보면서 따뜻하게 녹이셨으면 좋겠어요!",
  "txtN": "사용자가 요청한 개수 혹은 제공한 글의 개수만큼 줄바꿈(\\\\n)을 포함하여 순차적으로 생성..."
}
\`\`\``;

  if (gemsGuideCopyBtn) {
    gemsGuideCopyBtn.addEventListener('click', async () => {
      try {
        const copied = await copyToClipboard(GEMS_GUIDE_TEXT);
        if (copied) {
          showToast('💎 GEMS 지침서가 복사되었습니다!');
        } else {
          showToast('지침서 복사에 실패했습니다.', true);
        }
      } catch (e) {
        showToast('지침서 복사 중 오류가 발생했습니다.', true);
      }
    });
  }
});
