document.addEventListener('DOMContentLoaded', async () => {
  let currentWindowId = null;
  try {
    const curWin = await chrome.windows.getCurrent();
    currentWindowId = curWin ? curWin.id : null;
  } catch (e) {
    console.warn('Failed to get current windowId:', e);
  }
  const activeTitle = document.getElementById('active-title');
  const activeUrl = document.getElementById('active-url');
  const activeStatusBadge = document.getElementById('active-status-badge');
  const copyBtn = document.getElementById('copy-btn');
  const copySpinner = document.getElementById('copy-spinner');
  
  const batchCount = document.getElementById('batch-count');
  const batchWebCount = document.getElementById('batch-web-count');
  const batchBtn = document.getElementById('batch-btn');
  const batchSpinner = document.getElementById('batch-spinner');
  const batchBtnText = document.getElementById('batch-btn-text');
  const batchTxtStopBtn = document.getElementById('batch-txt-stop-btn');
  const batchHtmlBtn = document.getElementById('batch-html-btn');
  const batchHtmlSpinner = document.getElementById('batch-html-spinner');
  const batchHtmlBtnText = document.getElementById('batch-html-btn-text');
  const batchHtmlStopBtn = document.getElementById('batch-html-stop-btn');
  
  const htmlSaveBtn = document.getElementById('html-save-btn');
  const htmlSaveSpinner = document.getElementById('html-save-spinner');
  const pdfSaveBtn = document.getElementById('pdf-save-btn');
  const pdfSaveSpinner = document.getElementById('pdf-save-spinner');
  const pdfSaveBtnText = document.getElementById('pdf-save-btn-text');
  const pdfStopBtn = document.getElementById('pdf-stop-btn');
  const pdfBatchCheckbox = document.getElementById('pdf-batch-checkbox');
  const pdfBatchNaverOnly = document.getElementById('pdf-batch-naver-only');
  const pdfBatchTabCount = document.getElementById('pdf-batch-tab-count');
  const pdfBatchProgressBar = document.getElementById('pdf-batch-progress-bar');
  const pdfBatchProgressFill = document.getElementById('pdf-batch-progress-fill');
  const pdfBatchStatusText = document.getElementById('pdf-batch-status-text');
  const pdfBatchCompleteNotice = document.getElementById('pdf-batch-complete-notice');
  const pdfBatchCompleteText = document.getElementById('pdf-batch-complete-text');
  const pdfBatchNoticeClose = document.getElementById('pdf-batch-notice-close');
  const pdfBatchOptionRow = document.getElementById('pdf-batch-option-row');

  const batchTaskProgressBar = document.getElementById('batch-task-progress-bar');
  const batchTaskStatusText = document.getElementById('batch-task-status-text');

  const screenshotProgressBar = document.getElementById('screenshot-progress-bar');
  const screenshotStatusText = document.getElementById('screenshot-status-text');
  const screenshotStopBtn = document.getElementById('screenshot-stop-btn');
  const screenshotBtnText = document.getElementById('screenshot-btn-text');

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
  const tabBtnKeyword = document.getElementById('tab-btn-keyword');
  const tabBtnWrite = document.getElementById('tab-btn-write');
  const containerBlog = document.getElementById('container-blog');
  const containerCafe = document.getElementById('container-cafe');
  const containerKeyword = document.getElementById('container-keyword');
  const containerWrite = document.getElementById('container-write');

  // Keyword & QRA Elements
  const keywordSearchInput = document.getElementById('keyword-search-input');
  const keywordSearchBtn = document.getElementById('keyword-search-btn');
  const keywordSearchBtnText = document.getElementById('keyword-search-btn-text');
  const keywordSearchIcon = document.getElementById('keyword-search-icon');
  const keywordSpinner = document.getElementById('keyword-spinner');
  const keywordCurrentTabBtn = document.getElementById('keyword-current-tab-btn');
  const keywordTabDetectHint = document.getElementById('keyword-tab-detect-hint');
  const keywordClearBtn = document.getElementById('keyword-clear-btn');
  const keywordEmptyState = document.getElementById('keyword-empty-state');
  const keywordResultsSection = document.getElementById('keyword-results-section');
  const qraCountBadge = document.getElementById('qra-count-badge');
  const qraCopyBtn = document.getElementById('qra-copy-btn');
  const qraChipsContainer = document.getElementById('qra-chips-container');
  const acCountBadge = document.getElementById('ac-count-badge');
  const acCopyBtn = document.getElementById('ac-copy-btn');
  const acChipsContainer = document.getElementById('ac-chips-container');
  const gemsFullCopyBtn = document.getElementById('gems-full-copy-btn');
  const gemsUserMemo = document.getElementById('gems-user-memo');
  const openTopBlogsBtn = document.getElementById('open-top-blogs-btn');
  const openGeminiBtn = document.getElementById('open-gemini-btn');
  const keywordPdfSaveBtn = document.getElementById('keyword-pdf-save-btn');
  const keywordPdfSaveSpinner = document.getElementById('keyword-pdf-save-spinner');
  const keywordPdfSaveBtnText = document.getElementById('keyword-pdf-save-btn-text');
  const keywordPdfProgressBar = document.getElementById('keyword-pdf-progress-bar');
  const keywordPdfProgressFill = document.getElementById('keyword-pdf-progress-fill');
  const keywordPdfStatusText = document.getElementById('keyword-pdf-status-text');
  const keywordPdfStopBtn = document.getElementById('keyword-pdf-stop-btn');

  // Blog Auto-Write Elements
  const writePageStatusBadge = document.getElementById('write-page-status-badge');
  const writeCurrentTabTitle = document.getElementById('write-current-tab-title');
  const writeOpenPageContainer = document.getElementById('write-open-page-container');
  const writeOpenPageBtn = document.getElementById('write-open-page-btn');
  const writeJsonFile = document.getElementById('write-json-file');
  const writeFileLoadBtn = document.getElementById('write-file-load-btn');
  const writeSampleBtn = document.getElementById('write-sample-btn');
  const writeJsonInput = document.getElementById('write-json-input');
  const writeAuthorInput = document.getElementById('write-author-input');
  const writeAutoSave = document.getElementById('write-auto-save');
  const writeSpeedSelect = document.getElementById('write-speed-select');
  const writeStartBtn = document.getElementById('write-start-btn');
  const writeSpinner = document.getElementById('write-spinner');
  const writeBtnIcon = document.getElementById('write-btn-icon');
  const writeBtnText = document.getElementById('write-btn-text');
  const writeStopBtn = document.getElementById('write-stop-btn');
  const writeStopText = document.getElementById('write-stop-text');
  const writeProgressContainer = document.getElementById('write-progress-container');
  const writeProgressText = document.getElementById('write-progress-text');
  const writeProgressPercent = document.getElementById('write-progress-percent');
  const writeProgressBar = document.getElementById('write-progress-bar');
  const writeProgressStatus = document.getElementById('write-progress-status');
  
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
      return parsed.hostname === 'blog.naver.com' || parsed.hostname === 'm.blog.naver.com';
    } catch (e) {
      return false;
    }
  }

  // Resolves real blog post URL from PC Naver blog iframe#mainFrame if present
  async function resolveRealBlogUrl(tabId, originalUrl) {
    if (!originalUrl) return originalUrl;
    try {
      const parsed = new URL(originalUrl);
      if (parsed.hostname !== 'blog.naver.com') return originalUrl;

      const [frameCheck] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          try {
            const frame = document.getElementById('mainFrame') || document.querySelector('iframe[name="mainFrame"]');
            if (frame) {
              try {
                if (frame.contentWindow && frame.contentWindow.location && frame.contentWindow.location.href) {
                  const h = frame.contentWindow.location.href;
                  if (h && h !== 'about:blank') return h;
                }
              } catch (e) {}
              const src = frame.getAttribute('src');
              if (src) return new URL(src, window.location.href).href;
            }
          } catch (e) {}
          return null;
        }
      });

      if (frameCheck && frameCheck.result) {
        return frameCheck.result;
      }
    } catch (e) {
      console.warn('resolveRealBlogUrl error:', e);
    }
    return originalUrl;
  }

  // Convert PC Blog URL to Mobile Blog URL
  function getMobileBlogUrl(url) {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'm.blog.naver.com') return url;
      if (parsed.hostname !== 'blog.naver.com') return url;

      // 1. Parameter format: ?blogId=xxx&logNo=yyy
      if (parsed.searchParams.has('blogId') && parsed.searchParams.has('logNo')) {
        const blogId = parsed.searchParams.get('blogId');
        const logNo = parsed.searchParams.get('logNo');
        return `https://m.blog.naver.com/${blogId}/${logNo}`;
      }

      const pathSegments = parsed.pathname.split('/').filter(Boolean);

      // 2. Path blogId with searchParams logNo: /xxx?Redirect=Log&logNo=yyy
      if (pathSegments.length >= 1 && pathSegments[0] !== 'PostView.naver' && pathSegments[0] !== 'PostList.naver' && parsed.searchParams.has('logNo')) {
        const blogId = pathSegments[0];
        const logNo = parsed.searchParams.get('logNo');
        return `https://m.blog.naver.com/${blogId}/${logNo}`;
      }

      // 3. Path format: /xxx/yyy (where yyy is numeric post ID)
      if (pathSegments.length >= 2 && /^\d+$/.test(pathSegments[1])) {
        return `https://m.blog.naver.com/${pathSegments[0]}/${pathSegments[1]}`;
      }

      // 4. Blog Home: /xxx
      if (pathSegments.length === 1 && pathSegments[0] !== 'PostView.naver' && pathSegments[0] !== 'PostList.naver') {
        return `https://m.blog.naver.com/${pathSegments[0]}`;
      }

      parsed.hostname = 'm.blog.naver.com';
      return parsed.toString();
    } catch (e) {
      return url;
    }
  }

  // Update PDF batch tab count & button text according to naver-only filter
  async function updatePdfBatchCount() {
    if (!pdfBatchTabCount) return;
    try {
      const allTabsInWindow = await chrome.tabs.query({ currentWindow: true });
      const validWebTabs = allTabsInWindow.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
      const isNaverOnly = pdfBatchNaverOnly ? pdfBatchNaverOnly.checked : true;
      const targetTabs = isNaverOnly 
        ? validWebTabs.filter(t => isNaverBlogUrl(t.url))
        : validWebTabs;
      
      pdfBatchTabCount.textContent = `${targetTabs.length}`;
      if (pdfBatchCheckbox && pdfBatchCheckbox.checked) {
        if (pdfSaveBtnText && !isPdfRunning) {
          pdfSaveBtnText.textContent = `PDF 일괄 저장 (${targetTabs.length}개)`;
        }
        if (pdfSaveBtn && !isPdfRunning) {
          pdfSaveBtn.disabled = (targetTabs.length === 0);
        }
      }
      const blogTabs = validWebTabs.filter(t => isNaverBlogUrl(t.url));
      if (keywordPdfSaveBtnText && !isPdfRunning) {
        keywordPdfSaveBtnText.textContent = `PDF 일괄 저장 (${blogTabs.length}개)`;
      }
      if (keywordPdfSaveBtn && !isPdfRunning) {
        keywordPdfSaveBtn.disabled = (blogTabs.length === 0);
      }
    } catch (e) {
      console.warn('updatePdfBatchCount failed:', e);
    }
  }

  // Real-time tab monitoring for instant count updates
  chrome.tabs.onCreated.addListener(() => updatePdfBatchCount());
  chrome.tabs.onRemoved.addListener(() => updatePdfBatchCount());
  chrome.tabs.onUpdated.addListener((_, changeInfo) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      updatePdfBatchCount();
    }
  });

  // Tab Switcher Functions & Handlers
  function switchTab(tabId) {
    // Reset all tabs
    [tabBtnBlog, tabBtnCafe, tabBtnKeyword, tabBtnWrite].forEach(btn => btn && btn.classList.remove('active'));
    [containerBlog, containerCafe, containerKeyword, containerWrite].forEach(c => c && c.classList.remove('active'));

    if (tabId === 'cafe') {
      if (tabBtnCafe) tabBtnCafe.classList.add('active');
      if (containerCafe) containerCafe.classList.add('active');
    } else if (tabId === 'keyword') {
      if (tabBtnKeyword) tabBtnKeyword.classList.add('active');
      if (containerKeyword) containerKeyword.classList.add('active');
      checkKeywordTabStatus();
      updatePdfBatchCount();
    } else if (tabId === 'write') {
      if (tabBtnWrite) tabBtnWrite.classList.add('active');
      if (containerWrite) containerWrite.classList.add('active');
      checkBlogWriteTabStatus();
    } else {
      if (tabBtnBlog) tabBtnBlog.classList.add('active');
      if (containerBlog) containerBlog.classList.add('active');
    }

    try {
      chrome.storage.local.set({ activeTab: tabId });
    } catch (e) {
      console.error(e);
    }
  }

  if (tabBtnBlog) tabBtnBlog.addEventListener('click', () => switchTab('blog'));
  if (tabBtnCafe) tabBtnCafe.addEventListener('click', () => switchTab('cafe'));
  if (tabBtnKeyword) tabBtnKeyword.addEventListener('click', () => switchTab('keyword'));
  if (tabBtnWrite) tabBtnWrite.addEventListener('click', () => switchTab('write'));

  // Load last active tab & prompt checkbox from storage on startup
  try {
    chrome.storage.local.get(['activeTab', 'cafeIncludePrompt', 'pdfBatchNaverOnly', 'pdfBatchCheckbox', 'lastBatchPdfResult'], (result) => {
      if (result && result.activeTab) {
        switchTab(result.activeTab);
      } else {
        switchTab('blog');
      }
      if (cafeIncludePrompt && result && typeof result.cafeIncludePrompt === 'boolean') {
        cafeIncludePrompt.checked = result.cafeIncludePrompt;
      }
      if (pdfBatchNaverOnly) {
        if (result && typeof result.pdfBatchNaverOnly === 'boolean') {
          pdfBatchNaverOnly.checked = result.pdfBatchNaverOnly;
        } else {
          pdfBatchNaverOnly.checked = true; // default true
        }
      }
      if (pdfBatchCheckbox && result && typeof result.pdfBatchCheckbox === 'boolean') {
        pdfBatchCheckbox.checked = result.pdfBatchCheckbox;
      }
      if (result && result.lastBatchPdfResult && result.lastBatchPdfResult.saved > 0) {
        const diff = Date.now() - (result.lastBatchPdfResult.timestamp || 0);
        if (diff < 2 * 60 * 60 * 1000) { // within 2 hours
          if (pdfBatchCompleteNotice && pdfBatchCompleteText) {
            const folderText = result.lastBatchPdfResult.folder ? ` (${result.lastBatchPdfResult.folder} 폴더)` : '';
            pdfBatchCompleteText.textContent = `✅ 최근 저장 완료: ${result.lastBatchPdfResult.saved}/${result.lastBatchPdfResult.total}개 탭 PDF 저장됨${folderText}`;
            pdfBatchCompleteNotice.style.display = 'flex';
          }
        }
      }
      updatePdfBatchCount();
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

  // Helpers to apply active batch running states to UI
  function applyPdfBatchRunningState(status) {
    if (!status || !status.isRunning) return;
    if (copyBtn) copyBtn.disabled = true;
    if (pdfSaveBtn) pdfSaveBtn.disabled = true;
    if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'inline-block';
    
    const saved = status.saved || 0;
    const total = status.total || 0;
    const percent = total > 0 ? Math.round((saved / total) * 100) : 0;

    const btnText = `[${saved}/${total} 완료] (${percent}%)`;
    if (pdfSaveBtnText) pdfSaveBtnText.textContent = btnText;
    if (keywordPdfSaveBtnText) keywordPdfSaveBtnText.textContent = btnText;

    if (keywordPdfSaveBtn) keywordPdfSaveBtn.disabled = true;
    if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'inline-block';
    if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'flex';

    if (pdfBatchCheckbox) pdfBatchCheckbox.checked = true;
    if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'none';
    if (pdfBatchCompleteNotice) pdfBatchCompleteNotice.style.display = 'none';
    if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'flex';
    
    const isDone = status.status === 'downloaded';
    const actionText = isDone ? '저장 완료' : 'PDF 생성 중';
    const statusText = `[${saved}/${total} 완료] (${percent}%) ${actionText}: ${status.title || ''}`;
    if (pdfBatchStatusText) pdfBatchStatusText.textContent = statusText;
    if (keywordPdfStatusText) keywordPdfStatusText.textContent = statusText;

    if (pdfBatchProgressFill) pdfBatchProgressFill.style.width = `${percent}%`;
    if (keywordPdfProgressFill) keywordPdfProgressFill.style.width = `${percent}%`;

    const stopBtnHtml = '<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
    if (pdfStopBtn) {
      pdfStopBtn.style.display = 'inline-flex';
      pdfStopBtn.disabled = false;
      pdfStopBtn.innerHTML = stopBtnHtml;
    }
    if (keywordPdfStopBtn) {
      keywordPdfStopBtn.style.display = 'inline-flex';
      keywordPdfStopBtn.disabled = false;
      keywordPdfStopBtn.innerHTML = stopBtnHtml;
    }
  }

  function applyHtmlBatchRunningState(status) {
    if (!status || !status.isRunning) return;
    if (batchHtmlBtn) batchHtmlBtn.disabled = true;
    if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'inline-block';
    if (batchHtmlBtnText) {
      batchHtmlBtnText.textContent = `[${status.current}/${status.total}] 저장 중`;
    }
    if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'flex';
    if (batchTaskStatusText) {
      const isDone = status.status === 'downloaded';
      batchTaskStatusText.textContent = `[${status.current}/${status.total}] ${isDone ? '저장 완료' : 'HTML 수집 중'}: ${status.title || ''}`;
    }
    if (batchHtmlStopBtn) {
      batchHtmlStopBtn.style.display = 'inline-flex';
      batchHtmlStopBtn.disabled = false;
      batchHtmlStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
    }
    if (batchTxtStopBtn) batchTxtStopBtn.style.display = 'none';
  }

  // Initialize
  try {
    // 0. Immediate Fast-Path State Sync (0ms delay from local storage & background worker)
    let isPdfRunning = false;
    let isHtmlRunning = false;

    try {
      const winPdfKey = currentWindowId ? 'batchPdfState_' + currentWindowId : 'batchPdfState';
      const [stored, pdfStatus, htmlStatus] = await Promise.all([
        chrome.storage.local.get([winPdfKey, 'batchPdfState', 'batchHtmlState']).catch(() => ({})),
        chrome.runtime.sendMessage({ type: 'GET_BATCH_PDF_STATUS', windowId: currentWindowId }).catch(() => null),
        chrome.runtime.sendMessage({ type: 'GET_BATCH_HTML_STATUS' }).catch(() => null)
      ]);

      const activePdfState = (pdfStatus && pdfStatus.isRunning) 
        ? pdfStatus 
        : (stored?.[winPdfKey]?.isRunning ? stored[winPdfKey] : (stored?.batchPdfState?.windowId === currentWindowId && stored.batchPdfState.isRunning ? stored.batchPdfState : null));
      if (activePdfState) {
        isPdfRunning = true;
        applyPdfBatchRunningState(activePdfState);
      } else {
        isPdfRunning = false;
        if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'none';
        if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'flex';
        if (pdfStopBtn) pdfStopBtn.style.display = 'none';
        if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'none';

        if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'none';
        if (keywordPdfStopBtn) keywordPdfStopBtn.style.display = 'none';
        if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'none';
      }

      const activeHtmlState = (htmlStatus && htmlStatus.isRunning) ? htmlStatus : (stored?.batchHtmlState?.isRunning ? stored.batchHtmlState : null);
      if (activeHtmlState) {
        isHtmlRunning = true;
        applyHtmlBatchRunningState(activeHtmlState);
      } else {
        isHtmlRunning = false;
        if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'none';
        if (batchHtmlStopBtn) batchHtmlStopBtn.style.display = 'none';
        if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'none';
      }
    } catch (e) {
      console.warn('Initial batch status sync failed:', e);
    }

    // 1. Check active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab) {
      activeTitle.textContent = tab.title || '-';
      activeUrl.textContent = tab.url || '-';
      
      if (isNaverBlogUrl(tab.url)) {
        activeStatusBadge.textContent = '추출 가능';
        activeStatusBadge.className = 'badge badge-success';
        if (!isPdfRunning) copyBtn.disabled = false;
      } else {
        activeStatusBadge.textContent = '추출 불가';
        activeStatusBadge.className = 'badge badge-error';
        copyBtn.disabled = true;
      }

      // Enable HTML and PDF save buttons if it's not a chrome/system page
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
        if (!isHtmlRunning && htmlSaveBtn) htmlSaveBtn.disabled = false;
        if (!isPdfRunning) pdfSaveBtn.disabled = false;
        
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
        if (!isPdfRunning && pdfBatchCheckbox && pdfBatchCheckbox.checked) {
          if (pdfSaveBtn) pdfSaveBtn.disabled = false;
        } else {
          if (pdfSaveBtn) pdfSaveBtn.disabled = true;
        }
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
    await updatePdfBatchCount();
    if (!isHtmlRunning && batchHtmlBtn) {
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
        const actualUrl = await resolveRealBlogUrl(currentTab.id, currentTab.url);
        const mobileUrl = getMobileBlogUrl(actualUrl);
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
      if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'flex';
      if (batchTaskStatusText) {
        batchTaskStatusText.textContent = `[${msg.current}/${msg.total}] ${msg.status === 'downloaded' ? '저장 완료' : 'HTML 수집 중'}: ${msg.title || ''}`;
      }
      if (batchHtmlStopBtn) {
        batchHtmlStopBtn.style.display = 'inline-flex';
        batchHtmlStopBtn.disabled = false;
        batchHtmlStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
      }
      if (batchTxtStopBtn) batchTxtStopBtn.style.display = 'none';
      if (batchHtmlBtn) batchHtmlBtn.disabled = true;
      if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'inline-block';

      if (msg.status === 'downloaded') {
        showToast(`💾 [${msg.current}/${msg.total}] 다운로드 완료: ${msg.title}`);
      } else {
        showToast(`⏳ [${msg.current}/${msg.total}] 수집 중: ${msg.title}`);
      }
    } else if (msg.type === 'BATCH_SAVE_HTML_CANCELLED') {
      if (batchHtmlBtnText) {
        batchHtmlBtnText.textContent = 'HTML 일괄 저장';
      }
      if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'none';
      if (batchHtmlStopBtn) batchHtmlStopBtn.style.display = 'none';
      if (batchHtmlBtn) batchHtmlBtn.disabled = false;
      if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'none';
      showToast(`⏹️ HTML 일괄 저장이 중지되었습니다. (${msg.saved}/${msg.total}개 완료)`);
    } else if (msg.type === 'BATCH_SAVE_HTML_COMPLETE') {
      if (batchHtmlBtnText) {
        batchHtmlBtnText.textContent = 'HTML 일괄 저장';
      }
      if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'none';
      if (batchHtmlStopBtn) batchHtmlStopBtn.style.display = 'none';
      if (batchHtmlBtn) batchHtmlBtn.disabled = false;
      if (batchHtmlSpinner) batchHtmlSpinner.style.display = 'none';
      showToast(`🎉 총 ${msg.saved}개 탭 파일 다운로드 완료!`);
    }

    // PDF Batch Progress Updates
    if (msg.type === 'BATCH_SAVE_PDF_PROGRESS') {
      if (msg.windowId && currentWindowId && msg.windowId !== currentWindowId) {
        return; // Ignore updates belonging to a different browser window
      }
      isPdfRunning = true;
      if (copyBtn) copyBtn.disabled = true;
      if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'flex';
      if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'none';
      if (pdfBatchCompleteNotice) pdfBatchCompleteNotice.style.display = 'none';
      if (pdfSaveBtn) pdfSaveBtn.disabled = true;
      if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'inline-block';

      const saved = (typeof msg.saved === 'number') ? msg.saved : (msg.status === 'downloaded' ? msg.current : Math.max(0, msg.current - 1));
      const percent = msg.total > 0 ? Math.round((saved / msg.total) * 100) : 0;

      if (pdfSaveBtnText) {
        pdfSaveBtnText.textContent = `[${saved}/${msg.total} 완료] (${percent}%)`;
      }
      if (keywordPdfSaveBtnText) {
        keywordPdfSaveBtnText.textContent = `[${saved}/${msg.total} 완료] (${percent}%)`;
      }

      if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'flex';
      if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'flex';
      if (keywordPdfSaveBtn) keywordPdfSaveBtn.disabled = true;
      if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'inline-block';

      const actionText = msg.status === 'downloaded' ? '저장 완료' : 'PDF 생성 중';
      const statusText = `[${saved}/${msg.total} 완료] (${percent}%) ${actionText}: ${msg.title || ''}`;
      if (pdfBatchStatusText) pdfBatchStatusText.textContent = statusText;
      if (keywordPdfStatusText) keywordPdfStatusText.textContent = statusText;

      if (pdfBatchProgressFill) pdfBatchProgressFill.style.width = `${percent}%`;
      if (keywordPdfProgressFill) keywordPdfProgressFill.style.width = `${percent}%`;

      const stopBtnHtml = '<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
      if (pdfStopBtn) {
        pdfStopBtn.style.display = 'inline-flex';
        pdfStopBtn.disabled = false;
        pdfStopBtn.innerHTML = stopBtnHtml;
      }
      if (keywordPdfStopBtn) {
        keywordPdfStopBtn.style.display = 'inline-flex';
        keywordPdfStopBtn.disabled = false;
        keywordPdfStopBtn.innerHTML = stopBtnHtml;
      }

      if (msg.status === 'downloaded') {
        showToast(`📄 [${saved}/${msg.total}] PDF 저장 완료: ${msg.title}`);
      } else {
        showToast(`⏳ [${msg.current}/${msg.total}] PDF 생성 중: ${msg.title}`);
      }
    } else if (msg.type === 'BATCH_SAVE_PDF_CANCELLED') {
      if (msg.windowId && currentWindowId && msg.windowId !== currentWindowId) {
        return; // Ignore updates belonging to a different browser window
      }
      isPdfRunning = false;
      if (pdfSaveBtnText) {
        const count = pdfBatchTabCount ? pdfBatchTabCount.textContent : '';
        pdfSaveBtnText.textContent = pdfBatchCheckbox && pdfBatchCheckbox.checked ? `PDF 일괄 저장 (${count}개)` : 'PDF 저장';
      }
      if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'none';
      if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'none';
      if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'flex';
      if (pdfStopBtn) pdfStopBtn.style.display = 'none';
      if (keywordPdfStopBtn) keywordPdfStopBtn.style.display = 'none';
      if (copyBtn) copyBtn.disabled = false;
      if (pdfSaveBtn) pdfSaveBtn.disabled = false;
      if (keywordPdfSaveBtn) keywordPdfSaveBtn.disabled = false;
      if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'none';
      if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'none';

      if (pdfBatchCompleteNotice && pdfBatchCompleteText) {
        pdfBatchCompleteText.textContent = `⏹️ PDF 일괄 저장 중지됨 (${msg.saved}/${msg.total}개 저장됨)`;
        pdfBatchCompleteNotice.style.display = 'flex';
      }
      showToast(`⏹️ PDF 일괄 저장이 중지되었습니다. (${msg.saved}/${msg.total}개 완료)`);
      updatePdfBatchCount();
    } else if (msg.type === 'BATCH_SAVE_PDF_COMPLETE') {
      if (msg.windowId && currentWindowId && msg.windowId !== currentWindowId) {
        return; // Ignore updates belonging to a different browser window
      }
      isPdfRunning = false;
      if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'none';
      if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'none';
      if (pdfSaveBtn) pdfSaveBtn.disabled = false;
      if (keywordPdfSaveBtn) keywordPdfSaveBtn.disabled = false;
      if (pdfSaveBtnText) {
        const count = pdfBatchTabCount ? pdfBatchTabCount.textContent : '';
        pdfSaveBtnText.textContent = pdfBatchCheckbox && pdfBatchCheckbox.checked ? `PDF 일괄 저장 (${count}개)` : 'PDF 저장';
      }
      if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'none';
      if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'none';
      if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'flex';
      if (pdfStopBtn) pdfStopBtn.style.display = 'none';
      if (keywordPdfStopBtn) keywordPdfStopBtn.style.display = 'none';
      if (copyBtn) copyBtn.disabled = false;

      if (pdfBatchCompleteNotice && pdfBatchCompleteText) {
        const folderText = msg.folder ? ` (${msg.folder} 폴더)` : '';
        pdfBatchCompleteText.textContent = `✅ 총 ${msg.saved}개 탭 PDF 저장 완료!${folderText}`;
        pdfBatchCompleteNotice.style.display = 'flex';
      }

      const toastMsg = msg.folder 
        ? `🎉 '${msg.folder}' 폴더에 총 ${msg.saved}개 PDF 저장 완료!`
        : `🎉 총 ${msg.saved}개 탭 PDF 저장 완료!`;
      showToast(toastMsg);
    }
  });

  // Batch HTML Stop Button Click Handler
  if (batchHtmlStopBtn) {
    batchHtmlStopBtn.addEventListener('click', async () => {
      batchHtmlStopBtn.disabled = true;
      batchHtmlStopBtn.innerHTML = '<span>중지 중...</span>';
      showToast('⏹️ HTML 일괄 저장 중지 요청 중...');
      try {
        await chrome.runtime.sendMessage({ type: 'CANCEL_BATCH_HTML' });
      } catch (e) {
        console.error(e);
      }
    });
  }

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
        if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'flex';
        if (batchTaskStatusText) {
          batchTaskStatusText.textContent = `[0/${validWebTabs.length}] 시작...`;
        }
        if (batchHtmlStopBtn) {
          batchHtmlStopBtn.style.display = 'inline-flex';
          batchHtmlStopBtn.disabled = false;
          batchHtmlStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
        }
        if (batchTxtStopBtn) batchTxtStopBtn.style.display = 'none';
        if (batchHtmlBtnText) {
          batchHtmlBtnText.textContent = `[0/${validWebTabs.length}] 시작...`;
        }
        showToast(`🚀 ${validWebTabs.length}개 탭 일괄 저장을 시작합니다...`);

        const resp = await chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_HTML_TABS',
          tabIds: validWebTabs.map(t => t.id)
        });

        if (resp && resp.cancelled) {
          showToast(`⏹️ 총 ${resp.saved}개 저장 후 일괄 저장이 중지되었습니다.`);
        } else if (resp && resp.success) {
          showToast(`🎉 총 ${resp.saved}개 탭 저장 완료!`);
        } else {
          showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
        }
      } catch (err) {
        console.error('Batch HTML save failed:', err);
        showToast('일괄 저장 중 오류가 발생했습니다.', true);
      } finally {
        if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'none';
        if (batchHtmlStopBtn) batchHtmlStopBtn.style.display = 'none';
        batchHtmlBtn.disabled = false;
        batchHtmlSpinner.style.display = 'none';
        if (batchHtmlBtnText) {
          batchHtmlBtnText.textContent = 'HTML 일괄 저장';
        }
      }
    });
  }

  // Batch Blog Txt Stop Flag and Handler
  let isBatchTxtCancelled = false;
  if (batchTxtStopBtn) {
    batchTxtStopBtn.addEventListener('click', () => {
      isBatchTxtCancelled = true;
      batchTxtStopBtn.disabled = true;
      batchTxtStopBtn.innerHTML = '<span>중지 중...</span>';
      showToast('⏹️ 블로그 일괄 추출 중지 중...');
    });
  }

  // Batch Export & Download Event Handler
  batchBtn.addEventListener('click', async () => {
    isBatchTxtCancelled = false;
    batchBtn.disabled = true;
    batchSpinner.style.display = 'inline-block';
    if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'flex';
    if (batchTaskStatusText) {
      batchTaskStatusText.textContent = '블로그 감지 및 수집 준비 중...';
    }
    if (batchTxtStopBtn) {
      batchTxtStopBtn.style.display = 'inline-flex';
      batchTxtStopBtn.disabled = false;
      batchTxtStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
    }
    if (batchHtmlStopBtn) batchHtmlStopBtn.style.display = 'none';
    
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
        if (isBatchTxtCancelled) {
          break;
        }

        if (batchTaskStatusText) {
          batchTaskStatusText.textContent = `[${results.length + 1}/${naverTabs.length}] 블로그 추출 중...`;
        }

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
            const actualUrl = await resolveRealBlogUrl(tab.id, tab.url);
            const mobileUrl = getMobileBlogUrl(actualUrl);
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
      
      if (isBatchTxtCancelled) {
        showToast(`⏹️ 블로그 일괄 추출이 중지되었습니다. (${results.length}개 완료)`);
        if (results.length === 0) return;
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
      if (batchTaskProgressBar) batchTaskProgressBar.style.display = 'none';
      if (batchTxtStopBtn) batchTxtStopBtn.style.display = 'none';
      batchBtn.disabled = false;
      batchSpinner.style.display = 'none';
    }
  });

  // --- Screenshot Full Page Feature ---
  const screenshotBtn = document.getElementById('screenshot-btn');
  const screenshotSpinner = document.getElementById('screenshot-spinner');
  const screenshotTarget = document.getElementById('screenshot-target');

  const screenshotSmartCrop = document.getElementById('screenshot-smart-crop');
  if (screenshotSmartCrop) {
    chrome.storage.local.get(['screenshotSmartCrop'], (res) => {
      if (res.screenshotSmartCrop !== undefined) {
        screenshotSmartCrop.checked = res.screenshotSmartCrop;
      }
    });
    screenshotSmartCrop.addEventListener('change', () => {
      chrome.storage.local.set({ screenshotSmartCrop: screenshotSmartCrop.checked });
    });
  }

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

    let isScreenshotCancelled = false;
    if (screenshotStopBtn) {
      screenshotStopBtn.addEventListener('click', () => {
        isScreenshotCancelled = true;
        screenshotStopBtn.disabled = true;
        screenshotStopBtn.innerHTML = '<span>중지 중...</span>';
        showToast('⏹️ 캡처 중지 중...');
      });
    }

    screenshotBtn.addEventListener('click', async () => {
      isScreenshotCancelled = false;
      screenshotBtn.disabled = true;
      screenshotSpinner.style.display = 'inline-block';
      if (screenshotProgressBar) screenshotProgressBar.style.display = 'flex';
      if (screenshotStatusText) {
        screenshotStatusText.textContent = '캡처 준비 중...';
      }
      if (screenshotStopBtn) {
        screenshotStopBtn.style.display = 'inline-flex';
        screenshotStopBtn.disabled = false;
        screenshotStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
      }

      const enableSmartCrop = screenshotSmartCrop ? screenshotSmartCrop.checked : true;
      
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

        showToast('📸 전체 스크롤 캡처 시작 (고화질 준비 중)...');

        // 1. Pre-capture preparation: Auto-unfold collapsed detail descriptions & upgrade images to HD
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Auto expand Naver SmartStore / Shopping / Blog detail more buttons
            try {
              const moreBtns = document.querySelectorAll('button[class*="more" i], a[class*="more" i], [class*="detail_more" i], [class*="btn_more" i], [class*="fold" i], [class*="expand" i]');
              moreBtns.forEach(btn => {
                const txt = btn.innerText || btn.textContent || '';
                if (txt.includes('펼쳐보기') || txt.includes('더보기') || txt.includes('상세정보 펼치기') || txt.includes('상세 설명')) {
                  btn.click();
                }
              });
            } catch (e) {}

            // Remove artificial max-height limits on detail containers if any
            try {
              const detailContainers = document.querySelectorAll('[class*="detail_view" i], [class*="product_detail" i], [class*="se_content" i]');
              detailContainers.forEach(container => {
                if (container.style.maxHeight) container.style.maxHeight = 'none';
              });
            } catch (e) {}

            // Upgrade all images to full HD source
            const upgradeSrc = (src) => {
              if (!src) return src;
              let s = src;
              if (s.includes('w80_blur')) s = s.replace('w80_blur', 'w966');
              else if (s.includes('_blur')) s = s.replace(/type=[^&]+_blur/i, 'type=w966');
              s = s.replace(/type=(?:w|m|f)(?:80|100|150|200|300|400|500|640)(?:_blur)?/gi, 'type=w966');
              return s;
            };

            const imgs = Array.from(document.querySelectorAll('img'));
            imgs.forEach(img => {
              img.loading = 'eager';
              let realSrc = img.getAttribute('data-lazy-src') || 
                            img.getAttribute('data-src') || 
                            img.getAttribute('data-original') || 
                            img.getAttribute('data-actual-src') || 
                            img.getAttribute('lazy-src') || 
                            img.getAttribute('_src') ||
                            img.src;
              if (realSrc) {
                const upgraded = upgradeSrc(realSrc);
                if (img.src !== upgraded) img.src = upgraded;
              }
            });
          }
        });

        // Wait 400ms for DOM expansion and layout reflow
        await sleep(400);

        // 2. Measure page dimensions after unfolding and detect content bounds
        const [dimensionsResult] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [enableSmartCrop],
          func: (shouldCrop) => {
            const clientWidth = document.documentElement.clientWidth;
            const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
            const clientHeight = document.documentElement.clientHeight;
            const pixelRatio = window.devicePixelRatio || 1;
            const originalX = window.scrollX;
            const originalY = window.scrollY;

            let cropX = 0;
            let cropWidth = clientWidth;

            if (shouldCrop) {
              const candidateSelectors = [
                // Top purchase summary & order box
                '[class*="summary" i]',
                '[class*="order" i]',
                '[class*="buy" i]',
                '[class*="product_info" i]',
                '[class*="item_info" i]',
                'button[class*="buy" i]',
                'button[class*="cart" i]',
                'button[class*="pay" i]',
                'button[class*="order" i]',
                '[class*="btn_area" i]',
                'fieldset',
                'form',
                // Detail description & content body
                '#INTRODUCE',
                '[class*="product_detail" i]',
                '[class*="detail_view" i]',
                '[class*="detail" i]',
                '.se-main-container',
                '.se_component_wrap',
                '[class*="se_content" i]',
                '[class*="content_area" i]',
                // Content wrappers
                '#content',
                '#container',
                'main',
                '[role="main"]',
                'article',
                '.wrap_inner',
                '#articleBody'
              ];

              let minLeft = Infinity;
              let maxRight = -Infinity;
              let foundCount = 0;

              for (const sel of candidateSelectors) {
                const els = document.querySelectorAll(sel);
                els.forEach(el => {
                  try {
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') return;

                    const r = el.getBoundingClientRect();
                    // Must have visible content and not be a full-width background bar
                    if (r.width >= 50 && r.height >= 20 && r.width < clientWidth * 0.96) {
                      // Check horizontal position within viewport
                      if (r.left >= 0 && r.right <= clientWidth) {
                        // Skip small floating widgets at extreme edges
                        if (r.right > clientWidth - 25 && r.width < 70) return;
                        minLeft = Math.min(minLeft, r.left);
                        maxRight = Math.max(maxRight, r.right);
                        foundCount++;
                      }
                    }
                  } catch (e) {}
                });
              }

              // Fallback: check major child blocks of body / wrap
              if (foundCount === 0) {
                const majorBlocks = document.querySelectorAll('body > div, body > main, #wrap > div');
                majorBlocks.forEach(el => {
                  const r = el.getBoundingClientRect();
                  if (r.width >= 400 && r.width < clientWidth * 0.92 && r.height >= 300) {
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.position !== 'fixed') {
                      minLeft = Math.min(minLeft, r.left);
                      maxRight = Math.max(maxRight, r.right);
                      foundCount++;
                    }
                  }
                });
              }

              if (foundCount > 0 && minLeft < maxRight && (maxRight - minLeft) >= 350) {
                const pad = 24;
                const detectedX = Math.max(0, Math.floor(minLeft - pad));
                const detectedW = Math.min(clientWidth - detectedX, Math.ceil(maxRight - minLeft + pad * 2));
                // Only crop if there are meaningful side margins (at least 60px total empty space)
                if (clientWidth - detectedW >= 60) {
                  cropX = detectedX;
                  cropWidth = detectedW;
                }
              }
            }

            return {
              scrollHeight,
              clientHeight,
              clientWidth,
              devicePixelRatio: pixelRatio,
              originalX,
              originalY,
              cropX,
              cropWidth
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

        // Hide scrollbar temporarily
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            document.body.style.overflow = 'hidden';
          }
        });

        const captures = [];
        const scrollPositions = [];
        let currentY = 0;

        // 3. Loop scroll & capture
        while (currentY < totalHeight) {
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

          // For scrolled slices (scrollY > 0), temporarily hide fixed floating elements & neutralize sticky headers
          if (scrollY > 0) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                const fixedEls = [...document.querySelectorAll('*')].filter(el => {
                  try {
                    const style = window.getComputedStyle(el);
                    return style.position === 'fixed';
                  } catch (e) { return false; }
                });
                fixedEls.forEach(el => {
                  if (el.dataset.prevVisibility === undefined) {
                    el.dataset.prevVisibility = el.style.visibility || 'visible';
                  }
                  el.style.visibility = 'hidden';
                });

                const stickyEls = [...document.querySelectorAll('*')].filter(el => {
                  try {
                    const style = window.getComputedStyle(el);
                    return style.position === 'sticky';
                  } catch (e) { return false; }
                });
                stickyEls.forEach(el => {
                  if (el.dataset.prevPosition === undefined) {
                    el.dataset.prevPosition = el.style.position || 'sticky';
                  }
                  el.style.position = 'static';
                });
              }
            });
          }

          // Trigger eager load and wait for images in current viewport to fully complete loading
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => new Promise((resolve) => {
              const maxWait = setTimeout(resolve, 2000);
              const imgs = [...document.querySelectorAll('img')].filter(img => {
                const r = img.getBoundingClientRect();
                return r.top < window.innerHeight + 100 && r.bottom > -100 && r.width > 0;
              });

              const upgradeSrc = (src) => {
                if (!src) return src;
                let s = src;
                if (s.includes('w80_blur')) s = s.replace('w80_blur', 'w966');
                else if (s.includes('_blur')) s = s.replace(/type=[^&]+_blur/i, 'type=w966');
                s = s.replace(/type=(?:w|m|f)(?:80|100|150|200|300|400|500|640)(?:_blur)?/gi, 'type=w966');
                return s;
              };

              imgs.forEach(img => {
                img.loading = 'eager';
                let realSrc = img.getAttribute('data-lazy-src') || 
                              img.getAttribute('data-src') || 
                              img.getAttribute('data-original') || 
                              img.getAttribute('data-actual-src') || 
                              img.getAttribute('lazy-src') || 
                              img.getAttribute('_src') ||
                              img.src;
                if (realSrc) {
                  const upgraded = upgradeSrc(realSrc);
                  if (img.src !== upgraded) img.src = upgraded;
                }
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

          await sleep(250);

          if (screenshotStatusText) {
            const approxTotal = Math.max(1, Math.ceil(totalHeight / viewportHeight));
            screenshotStatusText.textContent = `[${captures.length + 1}/${approxTotal}] 스크롤 캡처 중...`;
          }

          // Capture visible tab safely with quota backoff retry
          const dataUrl = await safeCaptureVisibleTab(null, { format: 'png' });
          captures.push(dataUrl);

          if (isScreenshotCancelled) {
            break;
          }

          // Break if we've reached the bottom
          if (scrollY >= totalHeight - viewportHeight) {
            break;
          }
          currentY += viewportHeight;
        }

        // 4. Restore scrollbar, fixed/sticky element styles, and original position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [dim.originalX, dim.originalY],
          func: (ox, oy) => {
            document.body.style.overflow = '';
            
            const allModified = document.querySelectorAll('[data-prev-visibility], [data-prev-position]');
            allModified.forEach(el => {
              if (el.dataset.prevVisibility !== undefined) {
                el.style.visibility = el.dataset.prevVisibility === 'visible' ? '' : el.dataset.prevVisibility;
                delete el.dataset.prevVisibility;
              }
              if (el.dataset.prevPosition !== undefined) {
                el.style.position = el.dataset.prevPosition === 'sticky' ? '' : el.dataset.prevPosition;
                delete el.dataset.prevPosition;
              }
            });

            window.scrollTo(ox, oy);
          }
        });

        if (isScreenshotCancelled) {
          showToast('⏹️ 전체 캡처가 중지되었습니다.');
          return;
        }

        // 5. Stitch images together on canvas with smart cropping and Retina/High-DPI super-sampling
        showToast('🧩 고화질 이미지 조각 병합 중...');

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
        const capScaleX = firstImg.naturalWidth / viewportWidth;
        const capScaleY = firstImg.naturalHeight / viewportHeight;

        // Use smart horizontal crop bounds if detected
        const cropX = dim.cropX !== undefined ? dim.cropX : 0;
        const cropWidth = dim.cropWidth !== undefined ? dim.cropWidth : viewportWidth;

        // Canvas safe limits (max dimension 60,000px, max pixel buffer 200M pixels)
        const maxSafeHeight = 60000;
        const maxSafePixels = 200000000;

        // Retina/High-DPI Super-sampling: target 2.0x for crisp clarity if memory limits allow
        let actualScale = Math.max(pixelRatio, 2.0);
        if (totalHeight * actualScale > maxSafeHeight) {
          actualScale = Math.min(actualScale, maxSafeHeight / totalHeight);
        }
        if (cropWidth * actualScale * totalHeight * actualScale > maxSafePixels) {
          actualScale = Math.min(actualScale, Math.sqrt(maxSafePixels / (cropWidth * totalHeight)));
        }
        if (actualScale < 1.0 && totalHeight <= maxSafeHeight) {
          actualScale = 1.0;
        }

        const finalWidth = Math.round(cropWidth * actualScale);
        const finalHeight = Math.round(totalHeight * actualScale);

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Maintain crisp sharpness with high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw each screenshot piece onto canvas with exact integer coordinates & slice clipping
        for (let i = 0; i < loadedImages.length; i++) {
          const img = loadedImages[i];
          const scrollY = scrollPositions[i];
          const drawY = Math.round(scrollY * actualScale);

          const srcClipX = Math.round(cropX * capScaleX);
          const srcClipW = Math.round(cropWidth * capScaleX);

          if (i < loadedImages.length - 1) {
            // Clip non-last slice to next scroll position to eliminate overlapping/ghosting
            const nextScrollY = scrollPositions[i + 1];
            const sliceHeightCss = nextScrollY - scrollY;
            const srcClipH = Math.round(sliceHeightCss * capScaleY);
            const nextDrawY = Math.round(nextScrollY * actualScale);
            const destH = nextDrawY - drawY;

            ctx.drawImage(
              img,
              srcClipX, 0, srcClipW, srcClipH,
              0, drawY, finalWidth, destH
            );
          } else {
            // Last slice: draw the remaining portion to the bottom
            const remainingCss = totalHeight - scrollY;
            const srcClipH = Math.round(remainingCss * capScaleY);
            const destH = finalHeight - drawY;

            ctx.drawImage(
              img,
              srcClipX, 0, srcClipW, srcClipH,
              0, drawY, finalWidth, destH
            );
          }
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
        if (screenshotProgressBar) screenshotProgressBar.style.display = 'none';
        if (screenshotStopBtn) screenshotStopBtn.style.display = 'none';
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

  // PDF Batch Checkbox Toggle Handler
  if (pdfBatchCheckbox) {
    pdfBatchCheckbox.addEventListener('change', async () => {
      try {
        chrome.storage.local.set({ pdfBatchCheckbox: pdfBatchCheckbox.checked });
      } catch (e) {}
      if (!pdfSaveBtnText) return;
      if (pdfBatchCheckbox.checked) {
        await updatePdfBatchCount();
        const count = pdfBatchTabCount ? pdfBatchTabCount.textContent : '0';
        pdfSaveBtnText.textContent = `PDF 일괄 저장 (${count}개)`;
        if (pdfSaveBtn) pdfSaveBtn.disabled = false;
      } else {
        pdfSaveBtnText.textContent = 'PDF 저장';
      }
    });
  }

  // PDF Batch Notice Close Handler
  if (pdfBatchNoticeClose) {
    pdfBatchNoticeClose.addEventListener('click', () => {
      if (pdfBatchCompleteNotice) pdfBatchCompleteNotice.style.display = 'none';
      chrome.storage.local.remove(['lastBatchPdfResult']).catch(() => {});
    });
  }

  // PDF Batch Naver Only Checkbox Toggle Handler
  if (pdfBatchNaverOnly) {
    pdfBatchNaverOnly.addEventListener('change', async () => {
      try {
        chrome.storage.local.set({ pdfBatchNaverOnly: pdfBatchNaverOnly.checked });
      } catch (e) {
        console.error(e);
      }
      await updatePdfBatchCount();
    });
  }

  // PDF Stop Button Click Handler
  if (pdfStopBtn) {
    pdfStopBtn.addEventListener('click', async () => {
      pdfStopBtn.disabled = true;
      pdfStopBtn.innerHTML = '<span>중지 중...</span>';
      showToast('⏹️ PDF 일괄 저장 중지 요청 중...');
      try {
        await chrome.runtime.sendMessage({
          type: 'CANCEL_BATCH_PDF',
          windowId: currentWindowId
        });
      } catch (e) {
        console.error(e);
      }
    });
  }

  // PDF Download Event Handler (with auto mobile conversion & batch checkbox support)
  if (pdfSaveBtn) {
    pdfSaveBtn.addEventListener('click', async () => {
      // 1. Batch Mode if Checkbox is checked
      if (pdfBatchCheckbox && pdfBatchCheckbox.checked) {
        try {
          const allTabs = await chrome.tabs.query({ currentWindow: true });
          let validTabs = allTabs.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
          const isNaverOnly = pdfBatchNaverOnly ? pdfBatchNaverOnly.checked : true;
          if (isNaverOnly) {
            validTabs = validTabs.filter(t => isNaverBlogUrl(t.url));
          }

          if (validTabs.length === 0) {
            showToast(isNaverOnly ? '저장할 blog.naver.com 탭이 없습니다.' : '저장할 웹페이지 탭이 없습니다.', true);
            return;
          }

          pdfSaveBtn.disabled = true;
          pdfSaveSpinner.style.display = 'inline-block';
          if (copyBtn) copyBtn.disabled = true;
          if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'flex';
          if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'none';
          if (pdfBatchStatusText) {
            pdfBatchStatusText.textContent = `[0/${validTabs.length}] 시작...`;
          }
          if (pdfStopBtn) {
            pdfStopBtn.style.display = 'inline-flex';
            pdfStopBtn.disabled = false;
            pdfStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
          }
          if (pdfSaveBtnText) {
            pdfSaveBtnText.textContent = `[0/${validTabs.length}] 시작...`;
          }
          showToast(`🚀 ${validTabs.length}개 탭 PDF 일괄 저장을 시작합니다...`);

          const resp = await chrome.runtime.sendMessage({
            type: 'BATCH_SAVE_PDF_TABS',
            windowId: currentWindowId,
            tabIds: validTabs.map(t => t.id)
          });

          if (resp && resp.cancelled) {
            showToast(`⏹️ 총 ${resp.saved}개 저장 후 일괄 저장이 중지되었습니다.`);
          } else if (resp && resp.success) {
            const toastMsg = resp.folder 
              ? `🎉 '${resp.folder}' 폴더에 총 ${resp.saved}개 탭 PDF 저장 완료!`
              : `🎉 총 ${resp.saved}개 탭 PDF 저장 완료!`;
            showToast(toastMsg);
          } else {
            showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
          }
        } catch (err) {
          console.error('Batch PDF save failed:', err);
          showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
        } finally {
          if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'none';
          if (pdfBatchOptionRow) pdfBatchOptionRow.style.display = 'flex';
          if (pdfStopBtn) pdfStopBtn.style.display = 'none';
          if (copyBtn) copyBtn.disabled = false;
          pdfSaveBtn.disabled = false;
          pdfSaveSpinner.style.display = 'none';
          await updatePdfBatchCount();
        }
        return;
      }

      // 2. Single Tab Mode
      if (!currentTab) return;
      
      pdfSaveBtn.disabled = true;
      pdfSaveSpinner.style.display = 'inline-block';
      
      try {
        let isPcBlog = false;
        try {
          const parsed = new URL(currentTab.url);
          if (parsed.hostname === 'blog.naver.com') {
            isPcBlog = true;
          }
        } catch (e) {}

        if (isPcBlog) {
          showToast('📱 모바일 변환 및 PDF 생성 중...');
        } else {
          showToast('⏳ PDF 파일 생성 중...');
        }

        const resp = await chrome.runtime.sendMessage({
          type: 'SAVE_TAB_AS_PDF',
          tabId: currentTab.id
        });

        if (resp && resp.success) {
          if (resp.fallback) {
            showToast('🖨️ 인쇄/PDF 저장 창이 열렸습니다.');
          } else if (resp.isConverted) {
            showToast('📄 모바일 최적화 PDF 다운로드 시작!');
          } else {
            showToast('📄 PDF 파일 다운로드 시작!');
          }
        } else {
          showToast(resp?.message || 'PDF 저장 중 오류가 발생했습니다.', true);
        }
      } catch (err) {
        console.error('PDF save failed:', err);
        showToast('PDF 저장 중 오류가 발생했습니다.', true);
      } finally {
        pdfSaveBtn.disabled = false;
        pdfSaveSpinner.style.display = 'none';
      }
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

  // ==========================================
  // ✍️ Naver Blog Auto-Write Logic
  // ==========================================

  // Apply Blog Write UI state restored from background/storage
  function applyBlogWriteUIState(state, activeTabId) {
    if (!state) return;
    if (activeTabId && state.tabId && state.tabId !== activeTabId) return;

    if (state.isRunning) {
      writeStartBtn.disabled = true;
      if (writeSpinner) writeSpinner.style.display = 'inline-block';
      if (writeBtnIcon) writeBtnIcon.style.display = 'none';
      if (writeBtnText) writeBtnText.textContent = '블로그 글 작성 진행 중...';
      if (writeStopBtn) {
        writeStopBtn.style.display = 'inline-flex';
        writeStopBtn.disabled = false;
        if (writeStopText) writeStopText.textContent = '중단';
      }
      if (writeProgressContainer) {
        writeProgressContainer.style.display = 'block';
        if (writeProgressBar) writeProgressBar.style.width = `${state.percent || 2}%`;
        if (writeProgressPercent) writeProgressPercent.textContent = `${state.percent || 2}%`;
        if (writeProgressText) writeProgressText.textContent = state.text || '작성 진행 중...';
      }
      if (writeProgressStatus && state.detail) {
        writeProgressStatus.style.display = 'block';
        writeProgressStatus.textContent = state.detail;
      }
    } else {
      writeStartBtn.disabled = false;
      if (writeSpinner) writeSpinner.style.display = 'none';
      if (writeBtnIcon) writeBtnIcon.style.display = 'inline-block';
      if (writeBtnText) writeBtnText.textContent = '블로그 자동 작성 시작';
      if (writeStopBtn) writeStopBtn.style.display = 'none';

      if (state.completed) {
        if (writeProgressContainer) {
          writeProgressContainer.style.display = 'block';
          if (writeProgressBar) writeProgressBar.style.width = '100%';
          if (writeProgressPercent) writeProgressPercent.textContent = '100%';
          if (writeProgressText) writeProgressText.textContent = '원고 작성 완료!';
        }
        if (writeProgressStatus && state.detail) {
          writeProgressStatus.style.display = 'block';
          writeProgressStatus.textContent = state.detail;
        }
      } else if (state.cancelled) {
        if (writeProgressContainer) {
          writeProgressContainer.style.display = 'block';
          if (writeProgressText) writeProgressText.textContent = '작성 중단됨';
        }
        if (writeProgressStatus && state.detail) {
          writeProgressStatus.style.display = 'block';
          writeProgressStatus.textContent = state.detail;
        }
      }
    }
  }

  // Check if current tab is Naver Blog Write Editor
  async function checkBlogWriteTabStatus() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) return;

      currentTab = activeTab;
      const url = activeTab.url;
      const isBlogEditor = url.includes('blog.naver.com') && 
        (url.includes('Redirect=Write') || url.includes('GoBlogWrite') || url.includes('PostWriteForm') || url.includes('PostWrite'));

      if (writeCurrentTabTitle) {
        writeCurrentTabTitle.textContent = activeTab.title ? activeTab.title.substring(0, 26) + '...' : activeTab.url;
      }

      if (isBlogEditor) {
        if (writePageStatusBadge) {
          writePageStatusBadge.className = 'badge badge-success';
          writePageStatusBadge.textContent = '글쓰기 에디터 연결됨';
        }
        if (writeOpenPageContainer) writeOpenPageContainer.style.display = 'none';
        if (writeStartBtn) writeStartBtn.disabled = false;
      } else {
        if (writePageStatusBadge) {
          writePageStatusBadge.className = 'badge badge-danger';
          writePageStatusBadge.textContent = '글쓰기 페이지 아님';
        }
        if (writeOpenPageContainer) writeOpenPageContainer.style.display = 'block';
      }

      // Check real-time background status for this tab
      chrome.runtime.sendMessage({
        type: 'GET_BLOG_WRITE_STATUS',
        tabId: activeTab.id
      }, (resp) => {
        if (resp && resp.state) {
          applyBlogWriteUIState(resp.state, activeTab.id);
        }
      });
    } catch (err) {
      console.warn('checkBlogWriteTabStatus error:', err);
    }
  }

  // Open Naver Blog Write page in a new tab
  if (writeOpenPageBtn) {
    writeOpenPageBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://blog.naver.com/GoBlogWrite.naver' });
    });
  }

  // Sample JSON filler
  if (writeSampleBtn) {
    writeSampleBtn.addEventListener('click', () => {
      const sampleData = {
        title: "제주도 서귀포 가성비 흑돼지 맛집 솔직 후기",
        content: [
          {
            subtitle: "1. 매장 위치 및 주차 안내",
            body: "서귀포 올레시장 도보 3분 거리에 위치해 있어 접근성이 아주 훌륭했습니다.\n(IMG_01.jpg)\n가게 전용 주차 공간도 넉넉하여 렌트카로 방문하기에 안성맞춤이었어요."
          },
          {
            subtitle: "2. 흑돼지 근고기 맛과 육즙",
            body: "두툼하게 썰려 나온 흑돼지 목살과 오겹살은 참숯 향이 은은하게 배어 있었습니다.\n(IMG_02.jpg)\n멜젓에 푹 찍어 한 점 먹어보니 입안 가득 터지는 육즙이 일품이었습니다."
          }
        ],
        related_topics: [
          "📌 함께 둘러보기 좋은 서귀포 오션뷰 카페 BEST 3",
          "📌 중문 관광단지 필수 드라이브 코스"
        ],
        hashtags: ["#제주도맛집", "#서귀포흑돼지", "#내돈내산", "#제주여행추천"]
      };

      if (writeJsonInput) {
        const val = JSON.stringify(sampleData, null, 2);
        writeJsonInput.value = val;
        chrome.storage.local.set({ savedWriteJson: val });
        showToast('💡 샘플 원고 JSON이 입력되었습니다!');
      }
    });
  }

  // JSON File upload trigger & reader
  if (writeFileLoadBtn && writeJsonFile) {
    writeFileLoadBtn.addEventListener('click', () => {
      writeJsonFile.click();
    });

    writeJsonFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = (ev.target.result || '').replace(/\u00a0/g, ' ');
          // Verify valid JSON
          const parsed = JSON.parse(raw);
          if (writeJsonInput) {
            const val = JSON.stringify(parsed, null, 2);
            writeJsonInput.value = val;
            chrome.storage.local.set({ savedWriteJson: val });
            showToast(`📂 '${file.name}' 파일을 성공적으로 불러왔습니다!`);
          }
        } catch (err) {
          showToast('유효한 JSON 파일 형식이 아닙니다.', true);
        }
      };
      reader.readAsText(file, 'utf-8');
      // Reset input value to allow selecting the same file again
      writeJsonFile.value = '';
    });
  }

  // Auto-save blog write inputs on user typing
  if (writeJsonInput) {
    writeJsonInput.addEventListener('input', () => {
      chrome.storage.local.set({ savedWriteJson: writeJsonInput.value });
    });
  }
  if (writeAuthorInput) {
    writeAuthorInput.addEventListener('input', () => {
      chrome.storage.local.set({ savedWriteAuthor: writeAuthorInput.value });
    });
  }
  if (writeAutoSave) {
    writeAutoSave.addEventListener('change', () => {
      chrome.storage.local.set({ savedWriteAutoSave: writeAutoSave.checked });
    });
  }
  if (writeSpeedSelect) {
    writeSpeedSelect.addEventListener('change', () => {
      chrome.storage.local.set({ savedWriteSpeed: writeSpeedSelect.value });
    });
  }

  // Restore saved blog write inputs on popup load
  chrome.storage.local.get([
    'savedWriteJson',
    'savedWriteAuthor',
    'savedWriteAutoSave',
    'savedWriteSpeed',
    'blogWriteState'
  ], (res) => {
    if (res.savedWriteJson !== undefined && writeJsonInput && !writeJsonInput.value) {
      writeJsonInput.value = res.savedWriteJson;
    }
    if (res.savedWriteAuthor !== undefined && writeAuthorInput) {
      writeAuthorInput.value = res.savedWriteAuthor;
    }
    if (res.savedWriteAutoSave !== undefined && writeAutoSave) {
      writeAutoSave.checked = res.savedWriteAutoSave;
    }
    if (res.savedWriteSpeed !== undefined && writeSpeedSelect) {
      writeSpeedSelect.value = res.savedWriteSpeed;
    }
    if (res.blogWriteState) {
      applyBlogWriteUIState(res.blogWriteState);
    }
  });

  // Blog Auto-Write Execution Button
  if (writeStartBtn) {
    writeStartBtn.addEventListener('click', async () => {
      const jsonRaw = writeJsonInput ? writeJsonInput.value.trim() : '';
      if (!jsonRaw) {
        showToast('블로그 원고 JSON 데이터를 입력해주세요.', true);
        if (writeJsonInput) writeJsonInput.focus();
        return;
      }

      let blogData = null;
      try {
        blogData = JSON.parse(jsonRaw.replace(/\u00a0/g, ' '));
      } catch (err) {
        showToast('JSON 형식에 문법 오류가 있습니다. 쉼표나 따옴표를 확인해주세요.', true);
        return;
      }

      if (!blogData.title) {
        showToast('JSON에 "title" (제목) 항목이 누락되었습니다.', true);
        return;
      }

      // Ensure active tab is current
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        showToast('활성화된 탭을 찾을 수 없습니다.', true);
        return;
      }

      const url = activeTab.url || '';
      const isBlogEditor = url.includes('blog.naver.com') && 
        (url.includes('Redirect=Write') || url.includes('GoBlogWrite') || url.includes('PostWriteForm') || url.includes('PostWrite'));

      if (!isBlogEditor) {
        showToast('현재 탭이 네이버 블로그 글쓰기 창이 아닙니다.', true);
        return;
      }

      // UI state -> Writing
      writeStartBtn.disabled = true;
      if (writeSpinner) writeSpinner.style.display = 'inline-block';
      if (writeBtnIcon) writeBtnIcon.style.display = 'none';
      if (writeBtnText) writeBtnText.textContent = '블로그 글 작성 진행 중...';
      if (writeStopBtn) {
        writeStopBtn.style.display = 'inline-flex';
        writeStopBtn.disabled = false;
        if (writeStopText) writeStopText.textContent = '중단';
      }
      if (writeProgressContainer) {
        writeProgressContainer.style.display = 'block';
        if (writeProgressBar) writeProgressBar.style.width = '2%';
        if (writeProgressPercent) writeProgressPercent.textContent = '2%';
        if (writeProgressText) writeProgressText.textContent = '작성 준비 중...';
      }
      if (writeProgressStatus) {
        writeProgressStatus.style.display = 'block';
        writeProgressStatus.textContent = '🚀 에디터 접속 및 팝업 정리 중...';
      }

      try {
        const authorText = writeAuthorInput ? writeAuthorInput.value : '';
        const autoSave = writeAutoSave ? writeAutoSave.checked : true;
        const speed = writeSpeedSelect ? writeSpeedSelect.value : 'fast';

        showToast('🚀 블로그 자동 작성을 시작합니다!');

        // Delegate to background service worker via Chrome DevTools Protocol (CDP)
        const resp = await chrome.runtime.sendMessage({
          type: 'AUTO_WRITE_BLOG',
          tabId: activeTab.id,
          blogData: blogData,
          authorText: authorText,
          autoSave: autoSave,
          speed: speed
        });

        if (resp && resp.cancelled) {
          showToast('🛑 사용자에 의해 작성이 중단되었습니다.');
          if (writeProgressText) writeProgressText.textContent = '작성 중단됨';
          if (writeProgressStatus) {
            writeProgressStatus.textContent = '🛑 사용자에 의해 작성이 중단되었습니다.';
          }
        } else if (resp && resp.success) {
          if (writeProgressBar) writeProgressBar.style.width = '100%';
          if (writeProgressPercent) writeProgressPercent.textContent = '100%';
          if (writeProgressText) writeProgressText.textContent = '원고 작성 완료!';
          const saveMsg = resp.saved ? ' 및 임시저장 완료!' : ' 완료!';
          showToast(`🎉 "${resp.title}" 글 작성${saveMsg}`);
          if (writeProgressStatus) {
            writeProgressStatus.textContent = `✅ 글 작성${saveMsg} (소제목 ${resp.sectionsCount}개)`;
          }
        } else {
          const errMsg = resp?.error || '에디터 작성 중 오류가 발생했습니다.';
          showToast(errMsg, true);
          if (writeProgressStatus) {
            writeProgressStatus.textContent = `❌ ${errMsg}`;
          }
        }
      } catch (err) {
        console.error('Blog write execution error:', err);
        showToast('글 작성 처리 중 오류가 발생했습니다.', true);
        if (writeProgressStatus) {
          writeProgressStatus.textContent = '❌ 작성 오류가 발생했습니다.';
        }
      } finally {
        writeStartBtn.disabled = false;
        if (writeSpinner) writeSpinner.style.display = 'none';
        if (writeBtnIcon) writeBtnIcon.style.display = 'inline-block';
        if (writeBtnText) writeBtnText.textContent = '블로그 자동 작성 시작';
        if (writeStopBtn) {
          writeStopBtn.style.display = 'none';
          writeStopBtn.disabled = false;
          if (writeStopText) writeStopText.textContent = '중단';
        }
      }
    });
  }

  // Blog Auto-Write Stop Button
  if (writeStopBtn) {
    writeStopBtn.addEventListener('click', async () => {
      writeStopBtn.disabled = true;
      if (writeStopText) writeStopText.textContent = '중단 중...';
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
          await chrome.runtime.sendMessage({
            type: 'STOP_AUTO_WRITE_BLOG',
            tabId: activeTab.id
          });
        }
        showToast('🛑 글 작성 중단을 요청했습니다.');
      } catch (err) {
        console.warn('writeStopBtn error:', err);
      }
    });
  }

  // Real-time progress receiver from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'AUTO_WRITE_BLOG_PROGRESS') {
      applyBlogWriteUIState(msg);
    }
  });

  // ==========================================
  // 🔍 Keyword & QRA Analysis Logic (Manifest V3 Direct Fetch)
  // ==========================================
  let currentKeywordData = {
    keyword: '',
    qraList: [],
    acList: [],
    topBlogs: []
  };

  // Helper: Copy text to clipboard safely
  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('navigator.clipboard failed, fallback to execCommand', e);
    }
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
    } catch (err) {
      console.error('Copy fallback failed:', err);
      return false;
    }
  }

  // 1. Fetch Naver Autocomplete
  async function fetchNaverAutocomplete(keyword) {
    if (!keyword || !keyword.trim()) return [];
    try {
      const cleanKw = keyword.trim();
      const acUrl = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(cleanKw)}&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100`;
      const res = await fetch(acUrl);
      if (!res.ok) return [];
      const data = await res.json();
      let list = (data.items && Array.isArray(data.items[0]))
        ? data.items[0].map(x => Array.isArray(x) ? x[0] : x).filter(Boolean)
        : [];

      // If empty and multi-word, fallback to first token
      if (list.length === 0 && cleanKw.includes(' ')) {
        const rootKw = cleanKw.split(' ')[0];
        const rootUrl = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(rootKw)}&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100`;
        const rootRes = await fetch(rootUrl);
        if (rootRes.ok) {
          const rootData = await rootRes.json();
          if (rootData.items && Array.isArray(rootData.items[0])) {
            list = rootData.items[0].map(x => Array.isArray(x) ? x[0] : x).filter(Boolean);
          }
        }
      }
      return list;
    } catch (err) {
      console.warn('fetchNaverAutocomplete error:', err);
      return [];
    }
  }

  // 2. Fetch Naver QRA & Top Blogs
  async function fetchNaverQraAndBlogs(keyword) {
    if (!keyword || !keyword.trim()) return { qraList: [], topBlogs: [] };
    const cleanKw = keyword.trim();
    let qraList = [];
    let topBlogs = [];

    try {
      const searchUrl = `https://m.search.naver.com/search.naver?query=${encodeURIComponent(cleanKw)}`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        }
      });

      if (res.ok) {
        const html = await res.text();

        // 1) Match QRA Endpoint
        const qraMatch = html.match(/https:\/\/s\.search\.naver\.com\/p\/qra\/[^"'\\\s]+/);
        if (qraMatch) {
          const qraUrl = qraMatch[0].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
          try {
            const qraRes = await fetch(qraUrl, {
              headers: {
                'Referer': 'https://m.search.naver.com/',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
              }
            });
            if (qraRes.ok) {
              const qraData = await qraRes.json();
              if (qraData && qraData.result && Array.isArray(qraData.result.contents)) {
                qraList = qraData.result.contents.map(item => item.query).filter(Boolean);
              }
            }
          } catch (qErr) {
            console.warn('QRA fetch error:', qErr);
          }
        }

        // Fallback for PC related search if mobile QRA is empty
        if (qraList.length === 0) {
          try {
            const pcRes = await fetch(`https://search.naver.com/search.naver?query=${encodeURIComponent(cleanKw)}`);
            if (pcRes.ok) {
              const pcHtml = await pcRes.text();
              const kwdMatches = [...pcHtml.matchAll(/data-kwd=["']([^"']+)["']/g)].map(m => m[1]);
              if (kwdMatches.length > 0) {
                qraList = [...new Set(kwdMatches)];
              }
            }
          } catch (pcErr) {}
        }

        // 2) Extract Top 10 Blog URLs
        const blogMatches = html.match(/https:\/\/m\.blog\.naver\.com\/[a-zA-Z0-9_-]+\/[0-9]+/g) || [];
        topBlogs = [...new Set(blogMatches)].slice(0, 10);
      }
    } catch (err) {
      console.warn('fetchNaverQraAndBlogs error:', err);
    }

    return { qraList, topBlogs };
  }

  // 3. Render Keyword Chips
  function renderChips(container, items, isQra = false) {
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted); padding: 4px 0;">조회된 키워드가 없습니다.</span>';
      return;
    }

    items.forEach(kwd => {
      const chip = document.createElement('div');
      chip.className = `keyword-chip ${isQra ? 'qra-chip' : ''}`;
      chip.title = `'${kwd}' 클릭하여 복사`;
      chip.innerHTML = `
        <span>${escapeHtml(kwd)}</span>
        <svg class="chip-copy-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      `;
      chip.addEventListener('click', async () => {
        const ok = await copyTextToClipboard(kwd);
        if (ok) {
          showToast(`📋 '${kwd}' 복사 완료!`);
        }
      });
      container.appendChild(chip);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 4. Render Keyword Results to UI
  function renderKeywordResults(data) {
    if (!data || !data.keyword) return;
    currentKeywordData = data;

    if (keywordSearchInput) {
      keywordSearchInput.value = data.keyword;
    }

    if (keywordEmptyState) keywordEmptyState.style.display = 'none';
    if (keywordResultsSection) keywordResultsSection.style.display = 'block';
    if (keywordClearBtn) keywordClearBtn.style.display = 'inline-flex';

    if (qraCountBadge) qraCountBadge.textContent = `${(data.qraList || []).length}개`;
    if (acCountBadge) acCountBadge.textContent = `${(data.acList || []).length}개`;

    renderChips(qraChipsContainer, data.qraList || [], true);
    renderChips(acChipsContainer, data.acList || [], false);
  }

  // 5. Clear Keyword Results
  function clearKeywordData() {
    currentKeywordData = {
      keyword: '',
      qraList: [],
      acList: [],
      topBlogs: []
    };
    chrome.storage.local.remove(['savedKeywordData', 'savedGemsUserMemo']).catch(() => {});
    if (keywordSearchInput) keywordSearchInput.value = '';
    if (gemsUserMemo) gemsUserMemo.value = '';
    if (keywordResultsSection) keywordResultsSection.style.display = 'none';
    if (keywordEmptyState) keywordEmptyState.style.display = 'block';
    if (keywordClearBtn) keywordClearBtn.style.display = 'none';
    showToast('조회 내용이 초기화되었습니다.');
  }

  // 6. Execute Keyword Search
  async function executeKeywordSearch(targetKw) {
    const kw = (targetKw || (keywordSearchInput ? keywordSearchInput.value : '')).trim();
    if (!kw) {
      showToast('검색할 키워드를 입력해주세요.', true);
      if (keywordSearchInput) keywordSearchInput.focus();
      return;
    }

    if (keywordSearchBtn) keywordSearchBtn.disabled = true;
    if (keywordSpinner) keywordSpinner.style.display = 'inline-block';
    if (keywordSearchIcon) keywordSearchIcon.style.display = 'none';
    if (keywordSearchBtnText) keywordSearchBtnText.textContent = '수집 중...';

    try {
      const [acList, qraData] = await Promise.all([
        fetchNaverAutocomplete(kw),
        fetchNaverQraAndBlogs(kw)
      ]);

      currentKeywordData = {
        keyword: kw,
        qraList: qraData.qraList || [],
        acList: acList || [],
        topBlogs: qraData.topBlogs || []
      };

      renderKeywordResults(currentKeywordData);

      // Persist to chrome.storage.local so results remain when popup is closed/reopened
      chrome.storage.local.set({ savedKeywordData: currentKeywordData }).catch(() => {});

      showToast(`🎉 '${kw}' QRA ${currentKeywordData.qraList.length}개, 자동완성 ${currentKeywordData.acList.length}개 추출 완료!`);
    } catch (err) {
      console.error('executeKeywordSearch failed:', err);
      showToast('키워드 분석 중 오류가 발생했습니다.', true);
    } finally {
      if (keywordSearchBtn) keywordSearchBtn.disabled = false;
      if (keywordSpinner) keywordSpinner.style.display = 'none';
      if (keywordSearchIcon) keywordSearchIcon.style.display = 'inline-block';
      if (keywordSearchBtnText) keywordSearchBtnText.textContent = '조회';
    }
  }

  // 7. Load Saved Keyword Data on Startup
  async function loadSavedKeywordData() {
    try {
      const res = await chrome.storage.local.get(['savedKeywordData', 'savedGemsUserMemo']);
      if (res && res.savedKeywordData && res.savedKeywordData.keyword) {
        renderKeywordResults(res.savedKeywordData);
      }
      if (gemsUserMemo && typeof res?.savedGemsUserMemo === 'string') {
        gemsUserMemo.value = res.savedGemsUserMemo;
      }
    } catch (e) {
      console.warn('loadSavedKeywordData error:', e);
    }
  }

  // 8. Check Active Tab for Naver Query
  async function checkKeywordTabStatus() {
    try {
      // Clean up legacy recent keywords storage if any
      chrome.storage.local.remove(['recentKeywords']).catch(() => {});

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url) {
        const u = new URL(activeTab.url);
        if (u.hostname.includes('naver.com') && (u.pathname.includes('/search') || u.pathname.includes('search.naver'))) {
          const q = u.searchParams.get('query');
          if (q) {
            if (keywordTabDetectHint) {
              keywordTabDetectHint.textContent = `💡 현재 탭 감지: ${q}`;
              keywordTabDetectHint.title = `현재 검색 탭 검색어: ${q}`;
            }
            // Only autofill input if input is currently empty and no keyword result is saved
            if (keywordSearchInput && !keywordSearchInput.value.trim() && !currentKeywordData.keyword) {
              keywordSearchInput.value = q;
            }
            return;
          }
        }
      }
      if (keywordTabDetectHint) {
        keywordTabDetectHint.textContent = '💡 네이버 검색창 검색어 자동 연동';
      }
    } catch (e) {
      console.warn('checkKeywordTabStatus error:', e);
    }
  }

  // Memo auto-save
  if (gemsUserMemo) {
    gemsUserMemo.addEventListener('input', () => {
      chrome.storage.local.set({ savedGemsUserMemo: gemsUserMemo.value }).catch(() => {});
    });
  }

  // 7. GEMS Full Prompt Copy
  if (gemsFullCopyBtn) {
    gemsFullCopyBtn.addEventListener('click', async () => {
      if (!currentKeywordData.keyword) {
        showToast('먼저 키워드를 검색해주세요.', true);
        return;
      }

      const qraText = currentKeywordData.qraList.length > 0
        ? currentKeywordData.qraList.map(k => `- ${k}`).join('\n')
        : '- (수집된 연관 검색어 없음)';

      const acText = currentKeywordData.acList.length > 0
        ? currentKeywordData.acList.map(k => `- ${k}`).join('\n')
        : '- (수집된 자동완성 없음)';

      const memo = (gemsUserMemo ? gemsUserMemo.value.trim() : '');
      const memoSection = memo ? `\n\n[내 방문 경험 및 팩트]\n${memo}` : '';
      const memoRequestText = memo ? ' 및 내 방문 팩트' : '';

      const gemsPrompt = `[메인 공략 키워드]
${currentKeywordData.keyword}

[네이버 실시간 QRA 연관검색어 (함께 많이 찾는 검색어)]
${qraText}

[네이버 실시간 자동완성 키워드]
${acText}${memoSection}

---
[GEMS 작성 요청]
위 메인 키워드와 네이버 실시간 QRA 연관검색어, 자동완성어${memoRequestText}를 핵심 키워드로 적극 반영하여, 대형 전문 블로그와의 불필요한 경쟁을 피하고 당일 발행 즉시 스마트블록 1페이지 상단 노출을 달성할 수 있는 C-Rank 최적화 블로그 원고 구조(제목 및 소제목 본문)를 작성해주세요.`;

      const ok = await copyTextToClipboard(gemsPrompt);
      if (ok) {
        showToast('📋 GEMS 프롬프트용 키워드 복사 완료! Gemini에 붙여넣으세요.');
      } else {
        showToast('클립보드 복사에 실패했습니다.', true);
      }
    });
  }

  // 8. Individual Copy Handlers
  if (qraCopyBtn) {
    qraCopyBtn.addEventListener('click', async () => {
      if (!currentKeywordData.qraList || currentKeywordData.qraList.length === 0) {
        showToast('복사할 QRA 연관검색어가 없습니다.', true);
        return;
      }
      const ok = await copyTextToClipboard(currentKeywordData.qraList.join(', '));
      if (ok) showToast('🔥 QRA 연관검색어 복사 완료!');
    });
  }

  if (acCopyBtn) {
    acCopyBtn.addEventListener('click', async () => {
      if (!currentKeywordData.acList || currentKeywordData.acList.length === 0) {
        showToast('복사할 자동완성 키워드가 없습니다.', true);
        return;
      }
      const ok = await copyTextToClipboard(currentKeywordData.acList.join(', '));
      if (ok) showToast('⚡ 자동완성 키워드 복사 완료!');
    });
  }

  // 9. Open Top 10 Blogs in Tabs
  if (openTopBlogsBtn) {
    openTopBlogsBtn.addEventListener('click', async () => {
      let blogs = currentKeywordData.topBlogs;
      if (!blogs || blogs.length === 0) {
        const kw = keywordSearchInput ? keywordSearchInput.value.trim() : '';
        if (kw) {
          showToast('🔍 키워드 검색 후 상위 블로그를 여는 중입니다...');
          await executeKeywordSearch(kw);
          blogs = currentKeywordData.topBlogs;
        }
      }
      if (!blogs || blogs.length === 0) {
        showToast('상위 블로그 링크가 없습니다. 먼저 키워드를 검색해주세요.', true);
        return;
      }
      try {
        const count = blogs.length;
        for (const blogUrl of blogs) {
          await chrome.tabs.create({ url: blogUrl, active: false });
        }
        await updatePdfBatchCount();
        showToast(`📑 상위 블로그 ${count}개 탭을 열었습니다! 바로 옆 [PDF 일괄 저장]을 클릭하세요.`);
      } catch (err) {
        console.error('openTopBlogsBtn error:', err);
        showToast('탭 열기 중 오류가 발생했습니다.', true);
      }
    });
  }

  // 10. Keyword Tab PDF Batch Download Handler
  if (keywordPdfSaveBtn) {
    keywordPdfSaveBtn.addEventListener('click', async () => {
      try {
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        let validTabs = allTabs.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
        validTabs = validTabs.filter(t => isNaverBlogUrl(t.url));

        if (validTabs.length === 0) {
          showToast('저장할 blog.naver.com 탭이 없습니다. [상위 블로그 10개 열기]를 먼저 눌러주세요.', true);
          return;
        }

        keywordPdfSaveBtn.disabled = true;
        if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'inline-block';
        if (pdfSaveBtn) pdfSaveBtn.disabled = true;
        if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'inline-block';
        if (copyBtn) copyBtn.disabled = true;
        if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'flex';
        if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'flex';
        if (keywordPdfStatusText) {
          keywordPdfStatusText.textContent = `[0/${validTabs.length}] 시작...`;
        }
        if (keywordPdfStopBtn) {
          keywordPdfStopBtn.style.display = 'inline-flex';
          keywordPdfStopBtn.disabled = false;
          keywordPdfStopBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>중지</span>';
        }
        if (keywordPdfSaveBtnText) {
          keywordPdfSaveBtnText.textContent = `[0/${validTabs.length}] 시작...`;
        }
        showToast(`🚀 ${validTabs.length}개 블로그 탭 PDF 일괄 저장을 시작합니다...`);

        const resp = await chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_PDF_TABS',
          windowId: currentWindowId,
          tabIds: validTabs.map(t => t.id)
        });

        if (resp && resp.cancelled) {
          showToast(`⏹️ 총 ${resp.saved}개 저장 후 일괄 저장이 중지되었습니다.`);
        } else if (resp && resp.success) {
          const toastMsg = resp.folder 
            ? `🎉 '${resp.folder}' 폴더에 총 ${resp.saved}개 탭 PDF 저장 완료!`
            : `🎉 총 ${resp.saved}개 탭 PDF 저장 완료!`;
          showToast(toastMsg);
        } else {
          showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
        }
      } catch (err) {
        console.error('Keyword Batch PDF save failed:', err);
        showToast('일괄 저장 처리 중 오류가 발생했습니다.', true);
      } finally {
        if (keywordPdfProgressBar) keywordPdfProgressBar.style.display = 'none';
        if (pdfBatchProgressBar) pdfBatchProgressBar.style.display = 'none';
        if (keywordPdfStopBtn) keywordPdfStopBtn.style.display = 'none';
        if (pdfStopBtn) pdfStopBtn.style.display = 'none';
        if (copyBtn) copyBtn.disabled = false;
        if (keywordPdfSaveBtn) keywordPdfSaveBtn.disabled = false;
        if (pdfSaveBtn) pdfSaveBtn.disabled = false;
        if (keywordPdfSaveSpinner) keywordPdfSaveSpinner.style.display = 'none';
        if (pdfSaveSpinner) pdfSaveSpinner.style.display = 'none';
        await updatePdfBatchCount();
      }
    });
  }

  // 11. Keyword Tab PDF Stop Button Handler
  if (keywordPdfStopBtn) {
    keywordPdfStopBtn.addEventListener('click', async () => {
      keywordPdfStopBtn.disabled = true;
      keywordPdfStopBtn.innerHTML = '<span>중지 중...</span>';
      if (pdfStopBtn) {
        pdfStopBtn.disabled = true;
        pdfStopBtn.innerHTML = '<span>중지 중...</span>';
      }
      showToast('⏹️ PDF 일괄 저장 중지 요청 중...');
      try {
        await chrome.runtime.sendMessage({
          type: 'CANCEL_BATCH_PDF',
          windowId: currentWindowId
        });
      } catch (e) {
        console.error(e);
      }
    });
  }

  // 12. Open Gemini Link
  if (openGeminiBtn) {
    openGeminiBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://gemini.google.com/', active: true });
    });
  }

  // 13. Search Trigger Listeners
  if (keywordSearchBtn) {
    keywordSearchBtn.addEventListener('click', () => executeKeywordSearch());
  }

  if (keywordSearchInput) {
    keywordSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeKeywordSearch();
      }
    });
  }

  if (keywordClearBtn) {
    keywordClearBtn.addEventListener('click', () => clearKeywordData());
  }

  // Initial check on popup open
  checkBlogWriteTabStatus();
  loadSavedKeywordData().then(() => {
    checkKeywordTabStatus();
  });
});

