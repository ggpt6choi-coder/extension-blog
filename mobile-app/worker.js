// Naver Blog Proxy — Cloudflare Worker
// 배포 후 WORKER_URL 환경변수에 이 Worker의 URL을 설정하세요.

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // 파라미터 없으면 안내 페이지
    if (!target) {
      return new Response(
        '{"status":"ok","message":"Naver Blog Proxy Worker is running. Use ?url=https://m.blog.naver.com/..."}',
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 네이버 블로그 URL만 허용
    let targetUrl;
    try {
      targetUrl = new URL(target);
      const allowed = ['m.blog.naver.com', 'blog.naver.com'];
      if (!allowed.includes(targetUrl.hostname)) {
        return new Response(
          JSON.stringify({ error: '네이버 블로그 URL만 지원합니다.' }),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: '올바르지 않은 URL입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    try {
      const response = await fetch(target, {
        headers: {
          // iPhone Safari처럼 위장
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
          'Referer': 'https://m.blog.naver.com/',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      });

      const body = await response.arrayBuffer();

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        }
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || '페이지를 가져오지 못했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  }
};
