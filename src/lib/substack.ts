// Fetches the village's Substack RSS feed at BUILD TIME (this runs in Node
// during `astro build`/`astro dev`, not in the browser) so News posts show up
// automatically on the next deploy — no CMS entry needed for News.
//
export const SUBSTACK_FEED_URL = 'https://celinabarton.substack.com/feed';
export const SUBSTACK_PUBLICATION_URL = 'https://celinabarton.substack.com';

export interface SubstackPost {
	title: string;
	link: string;
	pubDate: Date;
	description: string;
}

const PLACEHOLDER_POSTS: SubstackPost[] = [
	{
		title: '[PLACEHOLDER] Connect a Substack publication to show real posts here',
		link: SUBSTACK_PUBLICATION_URL,
		pubDate: new Date(),
		description:
			'Once SUBSTACK_FEED_URL in src/lib/substack.ts points at a real Substack publication, its posts will populate here automatically on every rebuild.',
	},
];

function decodeEntities(str: string) {
	return str
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&amp;/g, '&');
}

function extractTag(block: string, tag: string) {
	const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
	if (!match) return '';
	const cdataMatch = match[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
	return decodeEntities((cdataMatch ? cdataMatch[1] : match[1]).trim());
}

function stripHtml(str: string) {
	return decodeEntities(str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

async function fetchDirect(limit: number): Promise<SubstackPost[]> {
	const res = await fetch(SUBSTACK_FEED_URL, {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			Accept: 'application/rss+xml, application/xml, text/xml, */*',
		},
	});
	if (!res.ok) throw new Error(`Substack feed responded with ${res.status}`);
	const xml = await res.text();
	const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
	if (items.length === 0) throw new Error('Substack feed had no <item> entries');

	return items.map(([, block]) => ({
		title: extractTag(block, 'title'),
		link: extractTag(block, 'link'),
		pubDate: new Date(extractTag(block, 'pubDate')),
		description: stripHtml(extractTag(block, 'description')).slice(0, 220),
	}));
}

// Fallback for hosts whose outbound IP Substack's CDN blocks outright —
// confirmed this is GitHub Actions' case: a real browser User-Agent on
// fetchDirect() still gets a 403 there even though the same request succeeds
// from a normal residential/office connection, which points to an IP-range
// block rather than user-agent sniffing. rss2json fetches the feed from its
// own servers and re-serves it as JSON, sidestepping the block.
async function fetchViaProxy(limit: number): Promise<SubstackPost[]> {
	const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(SUBSTACK_FEED_URL)}`;
	const res = await fetch(proxyUrl);
	if (!res.ok) throw new Error(`rss2json responded with ${res.status}`);
	const data = await res.json();
	if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
		throw new Error('rss2json returned no usable items');
	}

	return data.items.slice(0, limit).map((item: Record<string, string>) => ({
		title: decodeEntities(item.title ?? ''),
		link: item.link ?? SUBSTACK_PUBLICATION_URL,
		pubDate: new Date(item.pubDate ?? Date.now()),
		description: stripHtml(item.description ?? '').slice(0, 220),
	}));
}

export async function fetchSubstackPosts(limit = 6): Promise<SubstackPost[]> {
	try {
		return await fetchDirect(limit);
	} catch (directErr) {
		try {
			return await fetchViaProxy(limit);
		} catch (proxyErr) {
			console.warn(`[substack] Could not load ${SUBSTACK_FEED_URL} directly or via proxy, showing placeholder posts instead.`, {
				directErr,
				proxyErr,
			});
			return PLACEHOLDER_POSTS;
		}
	}
}
