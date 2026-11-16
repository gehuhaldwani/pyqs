// Service worker source. src/pages/sw.js.ts serves it with VERSION, BASE and PAPERS_ORIGIN defined above this file.
// Pages try the network first, so content is never stale while online. Hashed assets and opened papers come from the cache first.
/* global VERSION, BASE, PAPERS_ORIGIN */

const SHELL = `pyqs-shell-${VERSION}`;
const ASSETS = "pyqs-assets";
const PAGES = "pyqs-pages";
const PAPERS = "pyqs-papers";
const OFFLINE_URL = `${BASE}offline/`;

// Oldest entries go first once a cache passes its limit. Papers are large, so fewer of them are kept.
const LIMITS = { [ASSETS]: 400, [PAGES]: 200, [PAPERS]: 60 };

// Responses can vary on headers such as Origin, which differ between the request that cached a file and later ones.
// Cached entries are fixed assets or whole pages, so the lookup ignores Vary.
const MATCH = { ignoreVary: true };

// A slow network falls back to a saved copy after this long, if there is one.
const PAGE_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(SHELL);
			const response = await fetch(OFFLINE_URL, { cache: "no-cache" });
			const html = await response.clone().text();
			await cache.put(OFFLINE_URL, response);
			// The offline page needs its own CSS and scripts to look right without a network.
			const assets = [
				...html.matchAll(/(?:href|src)="([^"]*\/_astro\/[^"]+)"/g),
			].map((match) => match[1]);
			const assetCache = await caches.open(ASSETS);
			await assetCache.addAll([...new Set(assets)]);
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			for (const name of await caches.keys()) {
				if (name.startsWith("pyqs-shell-") && name !== SHELL) {
					await caches.delete(name);
				}
			}
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	// Range requests return partial responses, which the Cache API can't store.
	if (request.method !== "GET" || request.headers.has("range")) return;

	const url = new URL(request.url);

	if (url.origin === self.location.origin) {
		if (!url.pathname.startsWith(BASE)) return;
		if (url.pathname.startsWith(`${BASE}_astro/`)) {
			event.respondWith(cacheFirst(request, ASSETS));
		} else if (isPage(request, url)) {
			event.respondWith(networkFirstPage(event));
		}
		// Other files, such as build-info.json and this worker, always come from the network.
		return;
	}

	if (url.origin === PAPERS_ORIGIN && url.pathname.endsWith(".pdf")) {
		event.respondWith(cacheFirst(request, PAPERS));
	} else if (
		url.hostname === "cdn.jsdelivr.net" &&
		url.pathname.startsWith("/npm/@embedpdf/")
	) {
		event.respondWith(cacheFirst(request, ASSETS));
	}
});

// Navigations, and the client router's fetches for the next page.
function isPage(request, url) {
	return (
		request.mode === "navigate" ||
		request.headers.get("accept")?.includes("text/html") ||
		url.pathname.endsWith("/")
	);
}

async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request, MATCH);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) {
		await cache.put(request, response.clone());
		trim(cacheName);
	}
	return response;
}

async function networkFirstPage(event) {
	const { request } = event;
	const cache = await caches.open(PAGES);
	const network = fetch(request).then(async (response) => {
		if (response.ok) {
			await cache.put(request, response.clone());
			trim(PAGES);
		}
		return response;
	});
	// Keeps the cache write going when the timeout below answers first.
	event.waitUntil(network.catch(() => {}));

	const cachedAfterTimeout = new Promise((resolve) => {
		setTimeout(
			() => cache.match(request, MATCH).then(resolve),
			PAGE_TIMEOUT_MS,
		);
	});

	try {
		const response = await Promise.race([
			network,
			cachedAfterTimeout.then((cached) => cached ?? network),
		]);
		return response;
	} catch {
		const cached = await cache.match(request, MATCH);
		if (cached) return cached;
		const offline = await caches.match(OFFLINE_URL);
		return offline ?? Response.error();
	}
}

async function trim(cacheName) {
	const limit = LIMITS[cacheName];
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - limit))) {
		await cache.delete(key);
	}
}
