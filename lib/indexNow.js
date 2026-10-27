import { SITE } from '@/lib/structuredData';

// IndexNow tells Bing (and Yandex, Seznam, Naver) a URL changed, so a new report
// is crawled within minutes instead of whenever Bingbot comes back. Bing's index
// also feeds ChatGPT search and Copilot. Google does not use IndexNow.
//
// The key is public by design: search engines verify it by fetching
// public/<key>.txt, whose body must be exactly the key.
const KEY = 'ca725e2bebf8294faf40ab49038ec24c';

// paths: site paths with trailing slashes ('/report/2026-10-26/').
// Production only, so local and preview runs never announce URLs that don't
// exist on the live site. Never throws: a failed ping must not fail a publish.
export async function pingIndexNow(paths) {
  if (process.env.VERCEL_ENV !== 'production' || !paths.length) return { skipped: true };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: paths.map((p) => `${SITE}${p}`),
      }),
      signal: AbortSignal.timeout(5000),
    });
    // 200 and 202 both mean accepted.
    if (!res.ok) console.error(`IndexNow ping returned ${res.status}`);
    return { status: res.status };
  } catch (err) {
    console.error('IndexNow ping failed:', err.message);
    return { error: err.message };
  }
}
