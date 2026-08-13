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

export async function fetchSubstackPosts(limit = 6): Promise<SubstackPost[]> {
	try {
		const res = await fetch(SUBSTACK_FEED_URL);
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
	} catch (err) {
		console.warn(`[substack] Could not load ${SUBSTACK_FEED_URL}, showing placeholder posts instead.`, err);
		return PLACEHOLDER_POSTS;
	}
}
