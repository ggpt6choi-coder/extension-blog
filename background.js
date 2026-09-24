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

// Injects a premium notification toast inside the webpage
async function showWebToast(tabId, message, isError = false) {
  if (!tabId) return;
  try {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || !tab.url) return;
    const u = tab.url.toLowerCase();
    if (u.startsWith('chrome://') || u.startsWith('chrome-extension://') || u.startsWith('edge://') || u.startsWith('about:') || u.startsWith('view-source:')) {
      return;
    }

    await chrome.scripting.executeScript({
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
            @media print {
              #nblm-toast-notification {
                display: none !important;
                visibility: hidden !important;
              }
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
    }).catch(() => {});
  } catch (e) {}
}

// SingleFile Inliner Engine injected into web pages
const singleFileInlinerFunction = async (tabIndexInfo = null, isBatch = false) => {
  const showWebToast = (msg, isErr = false) => {
    let t = document.getElementById('__singlefile_toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '__singlefile_toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:rgba(24,24,27,0.92);color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;backdrop-filter:blur(4px);transition:opacity 0.3s;';
      document.body.appendChild(t);
    }
    t.style.background = isErr ? 'rgba(220,38,38,0.92)' : 'rgba(24,24,27,0.92)';
    t.textContent = tabIndexInfo ? `[${tabIndexInfo}] ${msg}` : msg;
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
    showWebToast('📦 문서 및 프레임 분석 중...');

    // 1. Detect inner content iframe for Naver Blog PC (#mainFrame) or Naver Cafe (#cafe_main)
    let targetDoc = document;
    const iframe = document.getElementById('mainFrame') || 
                   document.getElementById('cafe_main') || 
                   document.querySelector('iframe[name="mainFrame"]') ||
                   document.querySelector('iframe[name="cafe_main"]');

    if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
      targetDoc = iframe.contentDocument;
    }

    // 2. Clone document from targetDoc
    const docClone = targetDoc.documentElement.cloneNode(true);

    // 3. Clean up scripts and remove any toast notification elements from clone
    docClone.querySelectorAll('script, noscript, template, #__singlefile_toast, #nblm-toast-notification').forEach(el => el.remove());

    let head = docClone.querySelector('head');
    if (!head) {
      head = targetDoc.createElement('head');
      docClone.insertBefore(head, docClone.firstChild);
    }
    let metaCharset = head.querySelector('meta[charset]');
    if (!metaCharset) {
      metaCharset = targetDoc.createElement('meta');
      metaCharset.setAttribute('charset', 'utf-8');
      head.insertBefore(metaCharset, head.firstChild);
    }

    // Ensure proper title
    let titleEl = head.querySelector('title');
    if (!titleEl || !titleEl.textContent.trim()) {
      if (!titleEl) {
        titleEl = targetDoc.createElement('title');
        head.appendChild(titleEl);
      }
      titleEl.textContent = document.title || 'webpage';
    }

    // Convert relative <a> links to absolute
    docClone.querySelectorAll('a[href]').forEach(a => {
      try { a.href = a.href; } catch (e) {}
    });

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

    // 4. Inline External Stylesheets (<link rel="stylesheet">)
    showWebToast('🎨 외부 스타일시트(CSS) 및 폰트 인라인화 중...');
    const linkTags = Array.from(targetDoc.querySelectorAll('link[rel~="stylesheet"]'));
    const linkCloneTags = Array.from(docClone.querySelectorAll('link[rel~="stylesheet"]'));

    for (let i = 0; i < linkTags.length; i++) {
      const origLink = linkTags[i];
      const cloneLink = linkCloneTags[i];
      if (!cloneLink) continue;

      const href = origLink.href;
      if (!href) continue;

      let cssText = '';
      try {
        const sheet = Array.from(targetDoc.styleSheets).find(s => s.href === href);
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
        const styleTag = targetDoc.createElement('style');
        styleTag.setAttribute('data-original-href', href);
        styleTag.textContent = cssText;
        cloneLink.replaceWith(styleTag);
      }
    }

    const existingStyles = Array.from(docClone.querySelectorAll('style'));
    for (const style of existingStyles) {
      if (style.textContent && style.textContent.includes('url(')) {
        style.textContent = await processCssUrls(style.textContent, targetDoc.baseURI);
      }
    }

    // 5. Inline Images (<img>) with SmartEditor / Lazy-load support
    showWebToast('🖼️ 이미지 Base64 변환 및 인라인화 중...');
    const origImgs = Array.from(targetDoc.querySelectorAll('img'));
    const cloneImgs = Array.from(docClone.querySelectorAll('img'));

    const CHUNK_SIZE = 12;
    for (let i = 0; i < origImgs.length; i += CHUNK_SIZE) {
      const sliceOrig = origImgs.slice(i, i + CHUNK_SIZE);
      const sliceClone = cloneImgs.slice(i, i + CHUNK_SIZE);

      await Promise.all(sliceOrig.map(async (orig, idx) => {
        const clone = sliceClone[idx];
        if (!clone) return;

        // Check data-src, data-lazy-src first to avoid 1x1 transparent spacer gifs
        let src = orig.getAttribute('data-src') || 
                  orig.getAttribute('data-lazy-src') || 
                  orig.getAttribute('data-original') || 
                  orig.getAttribute('lazy-src') || 
                  orig.currentSrc || 
                  orig.src;

        if (src && src.startsWith('data:image/gif')) {
          src = orig.getAttribute('data-src') || orig.getAttribute('data-lazy-src') || orig.getAttribute('lazy-src') || orig.src;
        }

        if (!src || src.startsWith('data:')) {
          clone.removeAttribute('srcset');
          clone.removeAttribute('loading');
          return;
        }

        try {
          src = new URL(src, targetDoc.baseURI).href;
        } catch (e) {}

        let dataUrl = null;
        if (orig.complete && orig.naturalWidth > 0 && orig.naturalHeight > 0) {
          try {
            const canvas = targetDoc.createElement('canvas');
            canvas.width = orig.naturalWidth;
            canvas.height = orig.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(orig, 0, 0);
            dataUrl = canvas.toDataURL('image/png');
          } catch (e) {}
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

    const elementsWithInlineStyle = Array.from(docClone.querySelectorAll('[style*="url("]'));
    for (const el of elementsWithInlineStyle) {
      const currentStyle = el.getAttribute('style');
      if (currentStyle) {
        el.setAttribute('style', await processCssUrls(currentStyle, targetDoc.baseURI));
      }
    }

    // Ensure toast is removed from clone before building final HTML
    docClone.querySelectorAll('#__singlefile_toast, #nblm-toast-notification').forEach(el => el.remove());

    showWebToast('💾 SingleFile 패키징 완료!');
    const finalHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;

    const sanitizeTitle = (document.title || targetDoc.title || 'webpage')
      .replace(/[\\/:*?"<>|]/g, '_')
      .substring(0, 30);
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `${sanitizeTitle}_${dateStr}.html`;

    // Only do in-tab a.click download if NOT in batch mode
    if (!isBatch) {
      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = targetDoc.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      targetDoc.body.appendChild(a);
      a.click();
      targetDoc.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    }

    setTimeout(removeWebToast, 3000);

    return { 
      success: true, 
      filename, 
      htmlContent: finalHtml, 
      title: sanitizeTitle 
    };
  } catch (err) {
    showWebToast(`❌ SingleFile 저장 실패: ${err.message}`, true);
    throw err;
  }
};

// Function to save a tab as PDF (with auto-conversion of Naver Blog PC -> Mobile in background, auto-scroll & lazy-load triggers)
async function saveTabAsPdf(tab) {
  if (!tab || !tab.id) return { success: false, message: '유효한 탭이 아닙니다.' };
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    return { success: false, message: '시스템 페이지는 지원하지 않습니다.' };
  }

  let targetTabId = tab.id;
  let tempTabId = null;
  let isConverted = false;

  try {
    const parsed = new URL(tab.url);
    if (parsed.hostname === 'blog.naver.com') {
      const actualUrl = await resolveRealBlogUrl(tab.id, tab.url);
      const mobileUrl = getMobileBlogUrl(actualUrl);

      if (mobileUrl && mobileUrl !== tab.url) {
        showWebToast(tab.id, '📱 모바일 버전으로 자동 변환 중...');

        // Create hidden background tab
        const tempTab = await chrome.tabs.create({
          url: mobileUrl,
          active: false
        });
        tempTabId = tempTab.id;
        targetTabId = tempTab.id;
        isConverted = true;

        // Wait for the temp tab to complete loading
        await new Promise((resolve) => {
          let isResolved = false;
          const checkTab = (tId, changeInfo) => {
            if (tId === tempTabId && changeInfo.status === 'complete') {
              if (!isResolved) {
                isResolved = true;
                chrome.tabs.onUpdated.removeListener(checkTab);
                resolve();
              }
            }
          };
          chrome.tabs.onUpdated.addListener(checkTab);
          setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              chrome.tabs.onUpdated.removeListener(checkTab);
              resolve();
            }
          }, 12000);
        });

        // Settle delay for initial rendering
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  } catch (e) {
    console.warn('URL parsing or mobile tab creation failed:', e);
  }

  // Pre-print preparation: auto-scroll for lazy load, eager-load images, inject print-only styles, and reset overflow
  try {
    showWebToast(tab.id, '⏳ 상세 내용 및 이미지 준비 중...');
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: async () => {
        try {
          // 1. Inject Print Optimization Styles (hides toasts, floating bars, resets overflow/height)
          let printStyle = document.getElementById('nblm-pdf-print-fix');
          if (!printStyle) {
            printStyle = document.createElement('style');
            printStyle.id = 'nblm-pdf-print-fix';
            printStyle.textContent = `
              @media print {
                /* Hide toasts, floating buttons, sticky top headers, fixed navs, skeletons */
                #nblm-toast-notification,
                #__singlefile_toast,
                .Ngnb, [class*="Ngnb" i], header, nav[class*="gnb" i],
                .btn_top, button[class*="top" i], [class*="scrollTop" i], [class*="scroll_top" i],
                .floating_area, [class*="floating" i], [class*="Float" i],
                .u_ft, .pop_notice, .top_banner, [class*="toast" i],
                [class*="BottomBar" i], [class*="bottom_bar" i],
                [class*="snackBar" i], [class*="snackbar" i],
                [class*="skeleton" i], [class*="Skeleton" i], [class*="shimmer" i] {
                  display: none !important;
                  visibility: hidden !important;
                }

                /* Reset overflow & height to prevent blank pages / cutoff in SPA/React layouts */
                html, body, #root, #__next, #wrap, .wrap, main, [class*="container" i], [class*="content" i], [class*="layout" i] {
                  overflow: visible !important;
                  height: auto !important;
                  max-height: none !important;
                  min-height: auto !important;
                  position: static !important;
                }

                /* Avoid splitting headings, quotes, tables, and link cards across page breaks */
                h1, h2, h3, h4, h5, h6,
                .se-section-title, [class*="section_title" i], [class*="sectionTitle" i],
                .se-title-text, [class*="se-title" i],
                blockquote, .se-quote, [class*="se-quote" i],
                table, tr, td, th, [class*="table" i],
                figure, .se-module-image, [class*="module_image" i],
                [class*="component_image" i], .se-component-image,
                .se-oglink, [class*="oglink" i], [class*="link_card" i] {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                }

                /* Keep headings attached to subsequent paragraphs */
                h1, h2, h3, h4, h5, h6,
                .se-section-title, [class*="section_title" i], [class*="sectionTitle" i],
                .se-title-text, [class*="se-title" i] {
                  break-after: avoid !important;
                  page-break-after: avoid !important;
                }

                img, figure {
                  max-width: 100% !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `;
            document.head.appendChild(printStyle);
          }

          // 2. Wait for dynamic SPA content (React / Vue) to finish initial rendering & remove skeletons
          const startTime = Date.now();
          const maxWaitMs = 6000;
          while (Date.now() - startTime < maxWaitMs) {
            const hasPostContainer = document.querySelector('.se-main-container, #viewTypeSelector, [class*="post_article"], [class*="se_doc_viewer"]');
            const hasSkeleton = document.querySelector('[class*="skeleton" i], [class*="Skeleton" i], [class*="shimmer" i]');
            if (hasPostContainer && !hasSkeleton) {
              break;
            }
            const hasListItem = document.querySelector('[class*="postlist" i], [class*="post_item" i], [class*="item_box" i]');
            if (hasListItem && !hasSkeleton) {
              break;
            }
            await new Promise(r => setTimeout(r, 200));
          }

          // Brief delay to ensure DOM settle
          await new Promise(r => setTimeout(r, 300));

          // 3. Auto-scroll down the entire page to trigger IntersectionObserver & scroll-based lazy loading
          const originalScrollY = window.scrollY;
          const postContainer = document.querySelector('.se-main-container, #viewTypeSelector, [class*="post_article"], [class*="se_doc_viewer"]');
          
          let maxScrollTarget = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 1000);
          if (postContainer) {
            const rect = postContainer.getBoundingClientRect();
            maxScrollTarget = Math.min(window.scrollY + rect.bottom + 400, maxScrollTarget);
          } else {
            // Cap at 3500px for feed/list pages to prevent infinite scroll runaway
            maxScrollTarget = Math.min(maxScrollTarget, 3500);
          }

          const scrollStep = Math.max(window.innerHeight, 500);
          for (let pos = 0; pos < maxScrollTarget; pos += scrollStep) {
            window.scrollTo(0, pos);
            await new Promise(r => setTimeout(r, 70));
          }

          // Restore scroll position
          window.scrollTo(0, originalScrollY);

          // 4. Eager-load and swap real URLs for all lazy images
          const imgs = Array.from(document.querySelectorAll('img'));
          const waitPromises = [];

          imgs.forEach(img => {
            img.loading = 'eager';

            // Extract candidate URL from lazy attributes or current src
            let realSrc = img.getAttribute('data-lazy-src') || 
                          img.getAttribute('data-src') || 
                          img.getAttribute('data-original') || 
                          img.getAttribute('data-actual-src') || 
                          img.getAttribute('lazy-src') || 
                          img.getAttribute('_src') ||
                          img.src;

            // Naver blur replacement & HD upgrade
            if (realSrc) {
              if (realSrc.includes('w80_blur')) {
                realSrc = realSrc.replace('w80_blur', 'w966');
              } else if (realSrc.includes('_blur')) {
                realSrc = realSrc.replace(/type=[^&]+_blur/, 'type=w966');
              }
              if (realSrc.includes('type=w400')) {
                realSrc = realSrc.replace('type=w400', 'type=w966');
              }
            }

            if (realSrc && img.src !== realSrc) {
              img.src = realSrc;
            }

            if (img.src && !img.complete) {
              waitPromises.push(new Promise(res => {
                img.onload = img.onerror = res;
                setTimeout(res, 4000); // 4s timeout safety per image
              }));
            }
          });

          // Also check for background images
          document.querySelectorAll('[data-lazy-bg], [data-bg], [data-background]').forEach(el => {
            const bgUrl = el.getAttribute('data-lazy-bg') || el.getAttribute('data-bg') || el.getAttribute('data-background');
            if (bgUrl) {
              el.style.backgroundImage = `url("${bgUrl}")`;
            }
          });

          // Wait for all images and web fonts
          if (waitPromises.length > 0) {
            await Promise.all(waitPromises);
          }
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready.catch(() => {});
          }
        } catch (e) {
          console.error('Pre-print preparation failed:', e);
        }
      }
    });
    // Brief settle buffer for layout reflow
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (e) {
    console.warn('Pre-print script execution failed:', e);
  }

  let pdfSaved = false;

  try {
    await chrome.debugger.attach({ tabId: targetTabId }, '1.3');
    const result = await chrome.debugger.sendCommand(
      { tabId: targetTabId },
      'Page.printToPDF',
      {
        printBackground: true,
        paperWidth: 8.27,
        paperHeight: 11.69,
        marginTop: 0.3,
        marginBottom: 0.3,
        marginLeft: 0.3,
        marginRight: 0.3,
        preferCSSPageSize: false
      }
    );
    await chrome.debugger.detach({ tabId: targetTabId });

    if (result && result.data) {
      const dataUrl = `data:application/pdf;base64,${result.data}`;
      
      let title = tab.title || 'webpage';
      if (tempTabId) {
        try {
          const freshTempTab = await chrome.tabs.get(tempTabId);
          if (freshTempTab && freshTempTab.title) {
            title = freshTempTab.title;
          }
        } catch (e) {}
      }
      
      const sanitizeTitle = title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 30);
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const filename = `${sanitizeTitle}_${dateStr}.pdf`;

      await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      });

      showWebToast(tab.id, isConverted ? '📄 모바일 최적화 PDF 다운로드 시작!' : '📄 PDF 파일 다운로드 시작!');
      pdfSaved = true;
    }
  } catch (err) {
    console.warn('saveTabAsPdf debugger failed:', err);
    try { await chrome.debugger.detach({ tabId: targetTabId }); } catch (e) {}
  } finally {
    if (tempTabId) {
      try {
        await chrome.tabs.remove(tempTabId);
      } catch (e) {}
    }
  }

  // Fallback to window.print() on original tab if debugger failed
  if (!pdfSaved) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { window.print(); }
      });
      showWebToast(tab.id, '🖨️ 인쇄/PDF 저장 창이 열렸습니다.');
      return { success: true, fallback: true, message: '인쇄/PDF 저장 창이 열렸습니다.' };
    } catch (err) {
      showWebToast(tab.id, '❌ PDF 생성 실패', true);
      return { success: false, message: 'PDF 생성에 실패했습니다.' };
    }
  }

  return { success: true, isConverted, message: 'PDF 다운로드가 시작되었습니다.' };
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
        const actualUrl = await resolveRealBlogUrl(tab.id, tab.url);
        const mobileUrl = getMobileBlogUrl(actualUrl);
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
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: singleFileInlinerFunction
        });
      } catch (err) {
        showWebToast(tab.id, '❌ HTML 추출 실패: ' + (err.message || err), true);
      }
    } 
    
    else if (command === 'save-pdf') {
      await saveTabAsPdf(tab);
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
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const storage = await chrome.storage.local.get(['screenshotSmartCrop']);
      const enableSmartCrop = storage.screenshotSmartCrop !== undefined ? storage.screenshotSmartCrop : true;

      // 2. Get dimension parameters and content bounds from active tab after unfolding
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
            const selectors = [
              '#INTRODUCE',
              '[class*="product_detail" i]',
              '[class*="detail_view" i]',
              '#content',
              '#container',
              '.se-main-container',
              '.se_component_wrap',
              '[class*="se_content" i]',
              '[class*="content_area" i]',
              'main',
              '[role="main"]',
              'article',
              '.wrap_inner',
              '#articleBody'
            ];

            let minLeft = Infinity;
            let maxRight = -Infinity;
            let found = false;

            for (const sel of selectors) {
              const els = document.querySelectorAll(sel);
              els.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width >= 350 && r.height >= 250 && r.width < clientWidth * 0.95) {
                  if (r.left >= 0 && r.right <= clientWidth + 4) {
                    minLeft = Math.min(minLeft, r.left);
                    maxRight = Math.max(maxRight, r.right);
                    found = true;
                  }
                }
              });
            }

            if (!found) {
              const majorBlocks = document.querySelectorAll('body > div, body > main, #wrap > div');
              majorBlocks.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width >= 450 && r.width < clientWidth * 0.92 && r.height >= 400) {
                  const style = window.getComputedStyle(el);
                  if (style.display !== 'none' && style.visibility !== 'hidden') {
                    minLeft = Math.min(minLeft, r.left);
                    maxRight = Math.max(maxRight, r.right);
                    found = true;
                  }
                }
              });
            }

            if (found && minLeft < maxRight && (maxRight - minLeft) >= 350) {
              const pad = 24;
              const detectedX = Math.max(0, Math.floor(minLeft - pad));
              const detectedW = Math.min(clientWidth - detectedX, Math.ceil(maxRight - minLeft + pad * 2));
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
        showWebToast(tab.id, '❌ 페이지 크기 측정 실패', true);
        return;
      }
      
      const dim = dimensionsResult.result;
      const totalHeight = dim.scrollHeight;
      const viewportHeight = dim.clientHeight;
      const viewportWidth = dim.clientWidth;
      const pixelRatio = dim.devicePixelRatio;
      const cropX = dim.cropX !== undefined ? dim.cropX : 0;
      const cropWidth = dim.cropWidth !== undefined ? dim.cropWidth : viewportWidth;
      
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

      // 3. Loop scroll & capture
      while (currentY < totalHeight) {
        const scrollY = Math.min(currentY, totalHeight - viewportHeight);
        scrollPositions.push(scrollY);
        
        // Scroll tab
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [scrollY],
          func: (y) => { window.scrollTo(0, y); }
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

        await new Promise(r => setTimeout(r, 250));
        
        // Capture screenshot of visible tab viewport
        const dataUrl = await safeCaptureVisibleTab(null, { format: 'png' });
        captures.push(dataUrl);
        
        if (scrollY >= totalHeight - viewportHeight) {
          break;
        }
        currentY += viewportHeight;
      }
      
      // 4. Restore scrollbar, fixed/sticky element styles, and position
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
      
      // 5. Inject canvas stitching & download execution into the active tab's page context
      showWebToast(tab.id, '🧩 고화질 이미지 병합 및 저장 중...');
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [captures, scrollPositions, viewportWidth, viewportHeight, totalHeight, pixelRatio, cropX, cropWidth, tab.title],
        func: async (imgs, positions, w, vh, h, ratio, cX, cW, rawTitle) => {
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
          const capScaleX = firstImg.naturalWidth / w;
          const capScaleY = firstImg.naturalHeight / vh;

          const maxSafeHeight = 60000;
          const maxSafePixels = 200000000;

          let actualScale = Math.max(ratio, 2.0);
          if (h * actualScale > maxSafeHeight) {
            actualScale = Math.min(actualScale, maxSafeHeight / h);
          }
          if (cW * actualScale * h * actualScale > maxSafePixels) {
            actualScale = Math.min(actualScale, Math.sqrt(maxSafePixels / (cW * h)));
          }
          if (actualScale < 1.0 && h <= maxSafeHeight) {
            actualScale = 1.0;
          }

          const finalWidth = Math.round(cW * actualScale);
          const finalHeight = Math.round(h * actualScale);

          const canvas = document.createElement('canvas');
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          const ctx = canvas.getContext('2d', { alpha: false });

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          for (let i = 0; i < loadedImages.length; i++) {
            const img = loadedImages[i];
            const scrollY = positions[i];
            const drawY = Math.round(scrollY * actualScale);

            const srcClipX = Math.round(cX * capScaleX);
            const srcClipW = Math.round(cW * capScaleX);

            if (i < loadedImages.length - 1) {
              const nextScrollY = positions[i + 1];
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
              const remainingCss = h - scrollY;
              const srcClipH = Math.round(remainingCss * capScaleY);
              const destH = finalHeight - drawY;

              ctx.drawImage(
                img,
                srcClipX, 0, srcClipW, srcClipH,
                0, drawY, finalWidth, destH
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
      let wasSkipped = false;
      let skippedAuthor = '';

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

            // 작성자 닉네임 확인 (특정 닉네임 스킵)
            const findNickname = () => {
              const el = document.querySelector('.nick_box .nickname') ||
                         document.querySelector('.nick_box button') ||
                         document.querySelector('[data-nlog-area="content_header.writer_profile"]') ||
                         document.querySelector('.nick_box') ||
                         document.querySelector('button.nickname') ||
                         document.querySelector('.nickname');
              return el ? (el.textContent || '').trim() : '';
            };

            const writerNick = findNickname();
            const skipNicknames = ['김땡땡96', '다람쥐예신'];
            if (writerNick && skipNicknames.some(name => writerNick.includes(name))) {
              return { success: false, skipped: true, reason: 'author_match', author: writerNick };
            }

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
            if (res.result && res.result.skipped && res.result.reason === 'author_match') {
              wasSkipped = true;
              skippedAuthor = res.result.author || '';
              break;
            }
            if (res.result && res.result.success) {
              injected = true;
              break;
            }
          }
        }

        if (wasSkipped) {
          console.log(`[AutoComment] Tab ${tab.id} skipped (Author: ${skippedAuthor})`);
          await broadcastAutoCommentState({
            currentStep: i + 1,
            statusText: `${i + 1}/${totalToProcess}번째 탭 스킵됨 (작성자: ${skippedAuthor})`,
            statusColor: 'var(--accent-orange, #e67e22)'
          });
        } else if (injected) {
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
        const totalDelaySec = wasSkipped ? 1 : Math.max(1, Math.round(delaySec || 5));
        
        for (let s = totalDelaySec; s > 0; s--) {
          if (autoCommentAbortRequested) break;

          await broadcastAutoCommentState({
            currentStep: i + 1,
            statusText: wasSkipped
              ? `${i + 1}/${totalToProcess}번째 스킵됨 (다음 탭 이동 중...)`
              : `${i + 1}/${totalToProcess}번째 완료 (다음 탭까지 ${s}초 대기 중...)`,
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

// Global states for Batch PDF and Batch HTML processes
let isBatchPdfCancelled = false;
let batchPdfState = {
  isRunning: false,
  current: 0,
  total: 0,
  saved: 0,
  title: '',
  status: 'idle'
};

let isBatchHtmlCancelled = false;
let batchHtmlState = {
  isRunning: false,
  current: 0,
  total: 0,
  saved: 0,
  title: '',
  status: 'idle'
};

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

  // Save Tab as PDF (with background mobile auto-conversion for Naver Blog)
  if (message.type === 'SAVE_TAB_AS_PDF') {
    (async () => {
      try {
        const tab = await chrome.tabs.get(message.tabId);
        const result = await saveTabAsPdf(tab);
        sendResponse(result);
      } catch (err) {
        console.error('SAVE_TAB_AS_PDF message error:', err);
        sendResponse({ success: false, message: err.message || 'PDF 저장 실패' });
      }
    })();
    return true;
  }

  // Batch Save PDF across multiple tabs (sequential processing with progress notifications & cancellation)
  if (message.type === 'BATCH_SAVE_PDF_TABS') {
    (async () => {
      const tabIds = message.tabIds || [];
      let successCount = 0;
      isBatchPdfCancelled = false;
      batchPdfState = {
        isRunning: true,
        current: 0,
        total: tabIds.length,
        saved: 0,
        title: '',
        status: 'processing'
      };
      await chrome.storage.local.set({ batchPdfState }).catch(() => {});

      for (let i = 0; i < tabIds.length; i++) {
        if (isBatchPdfCancelled) {
          break;
        }

        const tabId = tabIds[i];
        let tab = null;
        try {
          tab = await chrome.tabs.get(tabId);
        } catch (e) {}

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
          continue;
        }

        batchPdfState.current = i + 1;
        batchPdfState.title = tab.title || '페이지';
        batchPdfState.status = 'processing';
        chrome.storage.local.set({ batchPdfState }).catch(() => {});

        // Broadcast start of current tab
        chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_PDF_PROGRESS',
          current: i + 1,
          total: tabIds.length,
          title: tab.title || '페이지',
          status: 'processing'
        }).catch(() => {});

        try {
          const res = await saveTabAsPdf(tab);
          if (res && res.success) {
            successCount++;
            batchPdfState.saved = successCount;
            batchPdfState.status = 'downloaded';
            chrome.storage.local.set({ batchPdfState }).catch(() => {});
          }
        } catch (err) {
          console.error(`Batch PDF tab ${tabId} failed:`, err);
        }

        if (isBatchPdfCancelled) {
          break;
        }

        // Broadcast finished for this tab
        chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_PDF_PROGRESS',
          current: i + 1,
          total: tabIds.length,
          title: tab.title || '페이지',
          status: 'downloaded'
        }).catch(() => {});

        // Delay between tabs to let debugger detach cleanly (checkable in 100ms intervals)
        if (i < tabIds.length - 1) {
          for (let d = 0; d < 10; d++) {
            if (isBatchPdfCancelled) break;
            await new Promise(r => setTimeout(r, 100));
          }
        }
      }

      batchPdfState.isRunning = false;
      batchPdfState.status = isBatchPdfCancelled ? 'cancelled' : 'complete';
      await chrome.storage.local.set({ batchPdfState }).catch(() => {});

      if (isBatchPdfCancelled) {
        chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_PDF_CANCELLED',
          total: tabIds.length,
          saved: successCount
        }).catch(() => {});

        try {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab && activeTab.id) {
            showWebToast(activeTab.id, `⏹️ PDF 일괄 저장이 중지되었습니다. (${successCount}/${tabIds.length}개 완료)`);
          }
        } catch (e) {}

        sendResponse({ success: false, cancelled: true, total: tabIds.length, saved: successCount });
        return;
      }

      // Broadcast all tabs complete
      chrome.runtime.sendMessage({
        type: 'BATCH_SAVE_PDF_COMPLETE',
        total: tabIds.length,
        saved: successCount
      }).catch(() => {});

      // Notify active tab with toast
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
          showWebToast(activeTab.id, `🎉 총 ${successCount}개 탭 PDF 일괄 저장 완료!`);
        }
      } catch (e) {}

      sendResponse({ success: true, total: tabIds.length, saved: successCount });
    })();
    return true;
  }

  // Cancel Batch PDF Handler
  if (message.type === 'CANCEL_BATCH_PDF') {
    isBatchPdfCancelled = true;
    batchPdfState.isRunning = false;
    batchPdfState.status = 'cancelled';
    chrome.storage.local.set({ batchPdfState }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  // Query Batch PDF Status Handler
  if (message.type === 'GET_BATCH_PDF_STATUS') {
    sendResponse(batchPdfState);
    return true;
  }

  // SingleFile Resource Fetchers (CORS-free via background service worker with 3.5s timeout)
  if (message.type === 'FETCH_RESOURCE_AS_DATA_URL') {
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(message.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const mimeType = res.headers.get('content-type') || 'image/png';
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        sendResponse({ success: true, dataUrl: `data:${mimeType};base64,${base64}` });
      } catch (err) {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'FETCH_RESOURCE_AS_TEXT') {
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(message.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        sendResponse({ success: true, text });
      } catch (err) {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Batch Save HTML across multiple tabs (Instant per-tab download via chrome.downloads API with cancellation)
  if (message.type === 'BATCH_SAVE_HTML_TABS') {
    (async () => {
      const tabIds = message.tabIds || [];
      let successCount = 0;
      isBatchHtmlCancelled = false;
      batchHtmlState = {
        isRunning: true,
        current: 0,
        total: tabIds.length,
        saved: 0,
        title: '',
        status: 'processing'
      };
      await chrome.storage.local.set({ batchHtmlState }).catch(() => {});

      for (let i = 0; i < tabIds.length; i++) {
        if (isBatchHtmlCancelled) {
          break;
        }

        const tabId = tabIds[i];
        let tabTitle = '페이지';
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab && tab.title) tabTitle = tab.title;
        } catch (e) {}

        batchHtmlState.current = i + 1;
        batchHtmlState.title = tabTitle;
        batchHtmlState.status = 'processing';
        chrome.storage.local.set({ batchHtmlState }).catch(() => {});

        // Broadcast start of current tab
        chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_HTML_PROGRESS',
          current: i + 1,
          total: tabIds.length,
          title: tabTitle,
          status: 'processing'
        }).catch(() => {});

        try {
          // Execute inliner inside tab and get complete HTML string
          const [execResult] = await chrome.scripting.executeScript({
            target: { tabId },
            args: [`${i + 1}/${tabIds.length}`, true],
            func: singleFileInlinerFunction
          });

          if (isBatchHtmlCancelled) {
            break;
          }

          if (execResult && execResult.result && execResult.result.htmlContent) {
            const res = execResult.result;
            
            // Convert HTML to Data URL for Service Worker download
            const encoder = new TextEncoder();
            const bytes = encoder.encode(res.htmlContent);
            let binary = '';
            const chunkSize = 8192;
            for (let j = 0; j < bytes.length; j += chunkSize) {
              binary += String.fromCharCode.apply(null, bytes.subarray(j, j + chunkSize));
            }
            const base64Html = btoa(binary);
            const dataUrl = `data:text/html;charset=utf-8;base64,${base64Html}`;

            // Trigger Chrome Download directly from background service worker
            await chrome.downloads.download({
              url: dataUrl,
              filename: res.filename,
              saveAs: false
            });

            successCount++;
            batchHtmlState.saved = successCount;
            batchHtmlState.status = 'downloaded';
            batchHtmlState.title = res.title || tabTitle;
            chrome.storage.local.set({ batchHtmlState }).catch(() => {});

            // Broadcast download complete for this tab
            chrome.runtime.sendMessage({
              type: 'BATCH_SAVE_HTML_PROGRESS',
              current: i + 1,
              total: tabIds.length,
              title: res.title || tabTitle,
              status: 'downloaded'
            }).catch(() => {});
          }

          // Short delay between tabs to prevent browser congestion
          if (i < tabIds.length - 1) {
            for (let d = 0; d < 6; d++) {
              if (isBatchHtmlCancelled) break;
              await new Promise(r => setTimeout(r, 100));
            }
          }
        } catch (err) {
          console.error(`Batch save tab ${tabId} failed:`, err);
        }
      }

      batchHtmlState.isRunning = false;
      batchHtmlState.status = isBatchHtmlCancelled ? 'cancelled' : 'complete';
      await chrome.storage.local.set({ batchHtmlState }).catch(() => {});

      if (isBatchHtmlCancelled) {
        chrome.runtime.sendMessage({
          type: 'BATCH_SAVE_HTML_CANCELLED',
          total: tabIds.length,
          saved: successCount
        }).catch(() => {});

        try {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab && activeTab.id) {
            showWebToast(activeTab.id, `⏹️ HTML 일괄 저장이 중지되었습니다. (${successCount}/${tabIds.length}개 완료)`);
          }
        } catch (e) {}

        sendResponse({ success: false, cancelled: true, total: tabIds.length, saved: successCount });
        return;
      }

      // Broadcast all tabs complete
      chrome.runtime.sendMessage({
        type: 'BATCH_SAVE_HTML_COMPLETE',
        total: tabIds.length,
        saved: successCount
      }).catch(() => {});

      sendResponse({ success: true, total: tabIds.length, saved: successCount });
    })();
    return true;
  }

  // Cancel Batch HTML Handler
  if (message.type === 'CANCEL_BATCH_HTML') {
    isBatchHtmlCancelled = true;
    batchHtmlState.isRunning = false;
    batchHtmlState.status = 'cancelled';
    chrome.storage.local.set({ batchHtmlState }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  // Query Batch HTML Status Handler
  if (message.type === 'GET_BATCH_HTML_STATUS') {
    sendResponse(batchHtmlState);
    return true;
  }

  // Handle Stop Blog Auto-Write
  if (message.type === 'STOP_AUTO_WRITE_BLOG') {
    const jobState = activeBlogWriteJobs.get(message.tabId);
    if (jobState) {
      jobState.cancelled = true;
      showWebToast(message.tabId, '🛑 블로그 자동 작성 중단 요청을 수신했습니다...');
      sendResponse({ success: true, message: '중단 요청이 전달되었습니다.' });
    } else {
      sendResponse({ success: false, message: '진행 중인 작성 작업이 없습니다.' });
    }
    return true;
  }

  // Query active blog write status
  if (message.type === 'GET_BLOG_WRITE_STATUS') {
    const jobState = activeBlogWriteJobs.get(message.tabId);
    chrome.storage.local.get(['blogWriteState'], (res) => {
      const state = res.blogWriteState;
      const isRunning = !!(jobState && !jobState.cancelled && state && state.isRunning);
      sendResponse({ success: true, isRunning, state });
    });
    return true;
  }

  // Handle Naver Blog Auto-Write via Chrome DevTools Protocol (CDP)
  if (message.type === 'AUTO_WRITE_BLOG') {
    (async () => {
      const { tabId, blogData, authorText, autoSave, speed } = message;
      try {
        const result = await autoWriteNaverBlogWithCdp(tabId, { blogData, authorText, autoSave, speed });
        sendResponse(result);
      } catch (err) {
        console.error('AUTO_WRITE_BLOG failed:', err);
        sendResponse({ success: false, error: err.message || '블로그 자동 작성에 실패했습니다.' });
      }
    })();
    return true;
  }
});

// Active CDP Blog Writer Jobs Map (tabId -> { cancelled: boolean })
const activeBlogWriteJobs = new Map();

// ==============================================================================
// ✍️ Chrome DevTools Protocol (CDP) Powered Naver Blog Auto-Writer Engine
// ==============================================================================
async function autoWriteNaverBlogWithCdp(tabId, { blogData, authorText, autoSave, speed }) {
  if (!tabId || !blogData) {
    return { success: false, error: '유효한 탭 또는 블로그 데이터가 없습니다.' };
  }

  const jobState = { cancelled: false };
  activeBlogWriteJobs.set(tabId, jobState);

  function checkCancelled() {
    if (jobState.cancelled) {
      const err = new Error('USER_CANCELLED');
      err.isCancelled = true;
      throw err;
    }
  }

  function reportProgress(percent, text, detail = '') {
    const p = Math.min(100, Math.max(0, Math.round(percent)));
    const stateObj = {
      tabId,
      isRunning: p < 100,
      completed: p === 100,
      title: blogData.title,
      percent: p,
      text,
      detail
    };
    chrome.storage.local.set({ blogWriteState: stateObj });
    chrome.runtime.sendMessage({
      type: 'AUTO_WRITE_BLOG_PROGRESS',
      ...stateObj
    }).catch(() => {});
  }

  const isFast = speed === 'fast';
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper to send CDP command
  async function sendCdp(method, params = {}) {
    return await chrome.debugger.sendCommand({ tabId }, method, params);
  }

  // Native CDP Keyboard Helpers (matching Playwright keyboard behavior exactly)
  async function cdpType(text, delayMs = 0) {
    if (!text) return;
    const chars = Array.from(text);
    if (delayMs > 0 || chars.length <= 40) {
      for (const char of chars) {
        await sendCdp('Input.insertText', { text: char });
        if (delayMs > 0) await sleep(delayMs);
      }
    } else {
      await sendCdp('Input.insertText', { text });
    }
  }

  async function cdpPressEnter() {
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'keyDown',
      windowsVirtualKeyCode: 13,
      key: 'Enter',
      code: 'Enter',
      text: '\r',
      unmodifiedText: '\r'
    });
    await sleep(30);
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 13,
      key: 'Enter',
      code: 'Enter'
    });
    await sleep(30);
  }

  async function cdpPressArrowDown() {
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      windowsVirtualKeyCode: 40,
      key: 'ArrowDown',
      code: 'ArrowDown'
    });
    await sleep(25);
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 40,
      key: 'ArrowDown',
      code: 'ArrowDown'
    });
    await sleep(25);
  }

  async function cdpPressPageDown() {
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      windowsVirtualKeyCode: 34,
      key: 'PageDown',
      code: 'PageDown'
    });
    await sleep(25);
    await sendCdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 34,
      key: 'PageDown',
      code: 'PageDown'
    });
    await sleep(25);
  }

  // Real Frame Click: Calculates viewport coordinates of element inside iframe#mainFrame and sends pure native CDP mouse events
  async function cdpClick(selector, { waitAfter = 200, clickCount = 1 } = {}) {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel) => {
        const frame = document.querySelector('iframe#mainFrame');
        const doc = frame?.contentDocument || document;
        const win = frame?.contentWindow || window;
        const frameRect = frame ? frame.getBoundingClientRect() : { left: 0, top: 0 };

        let el = null;
        const selectors = sel.split(',').map(s => s.trim());
        for (const s of selectors) {
          try {
            const found = doc.querySelector(s);
            if (found) {
              const r = found.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) {
                el = found;
                break;
              }
            }
          } catch (e) {}
        }
        if (!el) return null;

        // Ensure visible
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return null;

        let clickX = frameRect.left + r.left + r.width / 2;
        let clickY = frameRect.top + r.top + r.height / 2;

        // For canvas-bottom, click 20px below top of it
        if (el.classList.contains('se-canvas-bottom')) {
          clickY = frameRect.top + r.top + Math.min(r.height / 2, 20);
        }

        // Focus element safely
        try {
          if (typeof el.focus === 'function') el.focus();
        } catch (e) {}

        // If clicking an editable node, place caret inside it
        try {
          if (el.isContentEditable || el.closest('[contenteditable="true"]')) {
            const sel = win.getSelection();
            const range = doc.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } catch (e) {}

        return {
          x: Math.round(clickX),
          y: Math.round(clickY),
          found: true
        };
      },
      args: [selector]
    });

    const info = res?.[0]?.result;
    if (!info || !info.found) {
      return false;
    }

    // Pure native CDP mouse events
    await sendCdp('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: info.x,
      y: info.y
    });
    await sleep(25);

    for (let c = 1; c <= clickCount; c++) {
      await sendCdp('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: info.x,
        y: info.y,
        button: 'left',
        buttons: 1,
        clickCount: c
      });
      await sleep(35);
      await sendCdp('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: info.x,
        y: info.y,
        button: 'left',
        buttons: 0,
        clickCount: c
      });
      await sleep(25);
    }

    if (waitAfter > 0) {
      await sleep(waitAfter);
    }
    return true;
  }

  let attached = false;
  try {
    reportProgress(5, '에디터 접속 및 팝업 정리 중...', '🚀 에디터 접속 및 팝업 정리 중...');
    showWebToast(tabId, '🚀 블로그 자동 작성을 시작합니다...');
    await chrome.debugger.attach({ tabId }, '1.3');
    attached = true;

    // 1. 팝업 / 도움말 안전하게 닫기
    const popupRes = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const frame = document.querySelector('iframe#mainFrame');
        const doc = frame?.contentDocument || document;
        const cancelBtn = doc.querySelector('.se-popup-container button.se-popup-button-cancel');
        if (cancelBtn && cancelBtn.getBoundingClientRect().width > 0) return '.se-popup-container button.se-popup-button-cancel';
        const helpClose = doc.querySelector('.se-help-panel button.se-help-panel-close-button');
        if (helpClose && helpClose.getBoundingClientRect().width > 0) return '.se-help-panel button.se-help-panel-close-button';
        return null;
      }
    });
    const popupSel = popupRes?.[0]?.result;
    if (popupSel) {
      await cdpClick(popupSel, { waitAfter: 300 });
    }

    reportProgress(10, '스마트에디터 연결 확인 중...', '🔍 스마트에디터 로딩 감지 중...');

    // 2. 스마트에디터 제목 입력 영역 대기 (최대 10초)
    const titleParagraphSelector = 'div.se-component.se-documentTitle .se-title-text p.se-text-paragraph, .se-documentTitle [contenteditable="true"]';
    const contentParagraphSelector = 'div.se-component.se-text .se-component-content p.se-text-paragraph, div.se-component.se-text p.se-text-paragraph';

    let titleReady = false;
    for (let wait = 0; wait < 20; wait++) {
      const checkRes = await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel) => {
          const frame = document.querySelector('iframe#mainFrame');
          const doc = frame?.contentDocument || document;
          const el = doc.querySelector(sel);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        },
        args: [titleParagraphSelector]
      });
      if (checkRes?.[0]?.result) {
        titleReady = true;
        break;
      }
      await sleep(500);
    }

    if (!titleReady) {
      throw new Error('스마트에디터 로딩을 감지하지 못했습니다. 글쓰기 화면이 정상적으로 열려 있는지 확인해주세요.');
    }

    checkCancelled();

    // 제목 입력 영역 클릭
    const titleClicked = await cdpClick(titleParagraphSelector, { waitAfter: 200, clickCount: 1 });
    if (!titleClicked) {
      throw new Error('제목 입력 영역을 클릭하지 못했습니다.');
    }

    checkCancelled();
    reportProgress(12, '제목 입력 중...', `📝 제목: ${blogData.title.substring(0, 22)}...`);

    // 제목 입력 (CDP insertText)
    await cdpType(blogData.title);
    await sleep(200);

    // 제목 입력 후 엔터
    await cdpPressEnter();
    await sleep(200);

    checkCancelled();

    // 🔴 핵심: 제목에서 빠져나와 본문 첫 문단으로 직접 클릭 이동 (new-common-write.js & blog-write.js 1:1)
    let bodyFocused = await cdpClick(contentParagraphSelector, { waitAfter: 250, clickCount: 1 });
    if (!bodyFocused) {
      await cdpClick('div.se-canvas-bottom, .se-canvas-bottom', { waitAfter: 300 });
      bodyFocused = await cdpClick(contentParagraphSelector, { waitAfter: 250, clickCount: 1 });
    }

    // 안전 확인: 제목에 커서가 남아있는지 검사하고 필요시 강제 이동
    async function ensureFocusNotInTitle() {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (bodySel) => {
          const frame = document.querySelector('iframe#mainFrame');
          const doc = frame?.contentDocument || document;
          const win = frame?.contentWindow || window;
          const sel = win.getSelection();
          const anchor = sel?.anchorNode;
          const anchorEl = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
          const inTitle = !!anchorEl?.closest('.se-documentTitle, .se-title-text');
          if (inTitle) {
            const allP = Array.from(doc.querySelectorAll('div.se-component.se-text p.se-text-paragraph'));
            const targetP = allP[allP.length - 1];
            if (targetP) {
              targetP.focus();
              const range = doc.createRange();
              range.selectNodeContents(targetP);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        },
        args: [contentParagraphSelector]
      });
    }

    await ensureFocusNotInTitle();
    checkCancelled();

    reportProgress(15, '상단 서식 및 구분선 구성 중...', '✨ 구분선 및 상단 서식 배치 중...');

    // 3. 상단 작성자 표기 (선택 사항)
    if (authorText && authorText.trim()) {
      await cdpType(authorText.trim());
      await cdpPressEnter();
      await sleep(200);
    }

    checkCancelled();

    // 4. 구분선 추가 (정확히 1개만 깔끔하게 삽입)
    try {
      const hrBtnSelector = 'button.se-insert-horizontal-line-default-toolbar-button, li.se-toolbar-item-insert-horizontal-line button';
      const hrClicked = await cdpClick(hrBtnSelector, { waitAfter: 250 });
      if (hrClicked) {
        // 구분선 삽입 후 아래로 이동하여 새 문단 생성
        await cdpPressArrowDown();
        await sleep(80);
        await cdpPressEnter();
        await sleep(150);
      }
    } catch (e) {
      console.warn('구분선 삽입 무시:', e.message);
    }

    await ensureFocusNotInTitle();
    checkCancelled();

    // 이미지 설명 맵 생성 (id 기반 매핑)
    const imageMap = new Map();
    if (Array.isArray(blogData.images)) {
      for (const img of blogData.images) {
        if (img && img.id != null) {
          const desc = (img.description || img.recommended_filename || `이미지 ${img.id}`).trim();
          imageMap.set(String(img.id), desc);
        }
      }
    }

    // 5. 본문 입력 처리 (Array)
    const contents = Array.isArray(blogData.content) ? blogData.content : [{ body: String(blogData.content || '') }];
    const totalSec = Math.max(1, contents.length);

    for (let i = 0; i < contents.length; i++) {
      checkCancelled();
      const section = contents[i];
      const secProgress = 15 + Math.round((i / totalSec) * 65);

      // 소제목(subtitle)이 있는 경우 - 인용구 밑줄 스타일 적용
      if (section.subtitle) {
        reportProgress(secProgress, `소제목 작성 중 [${i + 1}/${totalSec}]`, `✍️ [${i + 1}/${totalSec}] 소제목 작성 중...`);
        showWebToast(tabId, `✍️ [${i + 1}/${totalSec}] 소제목 작성 중...`);

        // 인용구 드롭다운 열기
        const quoteBtnSelector = 'div[data-name="insert-quotation"] button.se-document-toolbar-select-option-button, button.se-insert-quotation-default-toolbar-button, li.se-toolbar-item-quotation button';
        await cdpClick(quoteBtnSelector, { waitAfter: 200 });

        // 밑줄 스타일 옵션 클릭
        const quoteUnderlineSelector = 'button.se-toolbar-option-insert-quotation-quotation_underline-button, button.se-insert-menu-sub-panel-button-quotation-quotation_underline, button[data-name="quotation_underline"]';
        await cdpClick(quoteUnderlineSelector, { waitAfter: 350 });

        checkCancelled();

        // 🔴 핵심: 생성된 인용구 내부 문단(p.se-text-paragraph)을 찾아 명시적으로 클릭 포커스
        const quoteParagraphSelector = 'div.se-component.se-quotation:last-of-type p.se-text-paragraph, div.se-quotation-underline p.se-text-paragraph';
        await cdpClick(quoteParagraphSelector, { waitAfter: 150, clickCount: 1 });

        // 소제목 타이핑 (이모지 포함 안전하게 글자별 타이핑)
        await cdpType(section.subtitle, isFast ? 15 : 30);
        await sleep(150);

        // 🔴 소제목 인용구 빠져나오기: ArrowDown 2회 + 캔버스 바닥 클릭
        await cdpPressArrowDown();
        await sleep(80);
        await cdpPressArrowDown();
        await sleep(80);
        await cdpClick('div.se-canvas-bottom, .se-canvas-bottom', { waitAfter: 200 });
      }

      // 본문 내용(body) 입력
      if (section.body) {
        const bodyProgress = 15 + Math.round(((i + 0.5) / totalSec) * 65);
        reportProgress(bodyProgress, `본문 작성 중 [${i + 1}/${totalSec}]`, `✍️ [${i + 1}/${totalSec}] 본문 내용 작성 중...`);
        showWebToast(tabId, `✍️ [${i + 1}/${totalSec}] 본문 내용 작성 중...`);
        await ensureFocusNotInTitle();

        const lines = section.body.split('\n');
        for (let k = 0; k < lines.length; k++) {
          checkCancelled();
          const line = lines[k];
          if (line) {
            // 다양한 이미지 표기 패턴 지원:
            // 1. (IMG_6989.jpg) 또는 (IMG_6989.png)
            // 2. [📷 이미지 1 삽입 위치], [이미지 1 삽입 위치], [사진 1] 등
            const imgPattern = /\((IMG_\d+\.(?:jpg|jpeg|png))\)|\[(?:📷\s*)?(?:이미지|사진)\s*(\d+)[^\]]*\]/gi;
            let lastIndex = 0;
            let match;

            while ((match = imgPattern.exec(line)) !== null) {
              const textBefore = line.substring(lastIndex, match.index);
              const imgFile = match[1];
              const imgId = match[2];

              if (textBefore.trim()) {
                await cdpType(textBefore);
              }

              // 이미지 가이드 텍스트 생성
              let guideText = '';
              if (imgId) {
                const desc = imageMap.get(String(imgId));
                guideText = desc ? `${imgId}. ${desc}` : `이미지 ${imgId}`;
              } else if (imgFile) {
                guideText = imgFile;
              }

              // 이미지 가이드 삽입 및 줄바꿈
              await cdpPressEnter();
              await cdpType(`📷 [사진 넣을 곳: ${guideText}]`, 10);
              await cdpPressEnter();
              await sleep(100);

              lastIndex = imgPattern.lastIndex;
            }

            const textAfter = line.substring(lastIndex);
            if (textAfter.trim()) {
              await cdpType(textAfter);
            }
          }
          // 줄바꿈
          await cdpPressEnter();
          if (lines.length > 5) await sleep(isFast ? 20 : 40);
        }
        await sleep(100);
      }
      await sleep(100);
    }

    checkCancelled();

    // 6. 연관 주제(주변 코스) 입력 추가
    if (blogData.related_topics && blogData.related_topics.length > 0) {
      reportProgress(83, '연관 추천 코스 작성 중...', '📌 주변 추천 코스 작성 중...');
      showWebToast(tabId, '📌 연관 주제 작성 중...');
      await ensureFocusNotInTitle();
      for (const topic of blogData.related_topics) {
        checkCancelled();
        await cdpType(topic);
        await cdpPressEnter();
        await sleep(isFast ? 25 : 50);
      }
      await cdpPressEnter();
      await sleep(150);
    }

    checkCancelled();

    // 7. 해시태그 입력 (맨 마지막에)
    if (blogData.hashtags && blogData.hashtags.length > 0) {
      reportProgress(90, '해시태그 작성 중...', '🏷️ 해시태그 배치 중...');
      showWebToast(tabId, '🏷️ 해시태그 작성 중...');
      await cdpPressPageDown();
      await sleep(150);
      await cdpClick('div.se-canvas-bottom, .se-canvas-bottom', { waitAfter: 200 });

      checkCancelled();
      const tagStr = blogData.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
      await cdpType(tagStr);
      await cdpPressEnter();
      await sleep(200);
    }

    checkCancelled();

    // 8. 임시저장 처리
    let saved = false;
    if (autoSave) {
      reportProgress(95, '임시저장 진행 중...', '💾 네이버 임시저장 클릭 중...');
      showWebToast(tabId, '💾 임시저장 진행 중...');
      const saveBtnSelector = 'button[data-click-area="tpb.save"], button[class*="save_btn"]';
      saved = await cdpClick(saveBtnSelector, { waitAfter: 1500 });
    }

    reportProgress(100, '원고 작성 완료!', `🎉 "${blogData.title}" 글 작성이 완료되었습니다!`);
    showWebToast(tabId, `🎉 "${blogData.title}" 글 작성이 완료되었습니다!`);

    return {
      success: true,
      title: blogData.title,
      sectionsCount: contents.length,
      saved: saved
    };

  } catch (err) {
    if (err.isCancelled || err.message === 'USER_CANCELLED') {
      showWebToast(tabId, '🛑 블로그 자동 작성이 중단되었습니다.');
      chrome.storage.local.set({
        blogWriteState: {
          tabId,
          isRunning: false,
          cancelled: true,
          title: blogData.title,
          percent: 0,
          text: '작성 중단됨',
          detail: '🛑 사용자에 의해 작성이 중단되었습니다.'
        }
      });
      return {
        success: false,
        cancelled: true,
        message: '사용자에 의해 작성이 중단되었습니다.'
      };
    }
    chrome.storage.local.set({
      blogWriteState: {
        tabId,
        isRunning: false,
        error: true,
        title: blogData.title,
        text: '오류 발생',
        detail: err.message || '작성 중 오류가 발생했습니다.'
      }
    });
    throw err;
  } finally {
    activeBlogWriteJobs.delete(tabId);
    if (attached) {
      try {
        await chrome.debugger.detach({ tabId });
      } catch (e) {}
    }
  }
}


