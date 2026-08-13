import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// QUICK MAP OF "WHERE DOES THIS TEXT LIVE" — each collection below is a
// folder of markdown files under src/content/<name>/. Add, edit, or delete
// a .md file in that folder to change what shows on the page in parens:
//   projects  -> src/content/projects/*.md   (News & Projects page, project cards)
//   explore   -> src/content/explore/*.md    (Explore & Visit page, trail/pond/itinerary cards)
//   resources -> src/content/resources/*.md  (Explore & Visit page, village map markers)
//   board     -> src/content/board/*.md      (Community Resources page, offers/needs posts)
//   settings  -> src/content/settings/homepage.json (homepage tagline/hero image)
// Everything else (headings, intro paragraphs, nav labels, footer text) is
// written directly in the relevant .astro file under src/pages/ or
// src/components/ — see the comments in those files.

// Ongoing/completed village projects (grants, capstone work, etc.), edited
// locally via markdown or the Decap CMS. Day-to-day News now lives on
// Substack instead — see src/lib/substack.ts.
const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			status: z.enum(['Ongoing', 'Completed']).default('Ongoing'),
			summary: z.string(),
			cover: image().optional(),
			coverAlt: z.string().optional(),
			link: z.string().url().optional(),
			linkLabel: z.string().optional(),
			draft: z.boolean().default(false),
		}),
});

const explore = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/explore' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			category: z.enum(['Trail', 'Water & Pond', 'Itinerary', 'Seasonal Activity']),
			season: z.array(z.enum(['Spring', 'Summer', 'Fall', 'Winter'])).default(['Spring', 'Summer', 'Fall', 'Winter']),
			summary: z.string(),
			cover: image().optional(),
			coverAlt: z.string().optional(),
			order: z.number().default(0),
		}),
});

const resources = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
	schema: z.object({
		name: z.string(),
		category: z.enum(['Services', 'Civic', 'Businesses', 'Historic Sites']),
		address: z.string().optional(),
		lat: z.number().optional(),
		lng: z.number().optional(),
		description: z.string(),
		hours: z.string().optional(),
		link: z.string().url().optional(),
		phone: z.string().optional(),
	}),
});

// Community "Offers & Needs" board — a low-friction mutual-aid bulletin board.
// Anyone with CMS access can post an offer (something they can give/lend/help
// with) or a need (something they're looking for), edited the same way as
// every other collection: markdown files or the Decap CMS at /admin.
const board = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/board' }),
	schema: z.object({
		type: z.enum(['Offer', 'Need']),
		title: z.string(),
		description: z.string(),
		name: z.string().optional(),
		contact: z.string().optional(),
		date: z.coerce.date(),
		draft: z.boolean().default(false),
	}),
});

const settings = defineCollection({
	loader: file('./src/content/settings/homepage.json'),
	schema: z.object({
		tagline: z.string(),
		heroImage: z.string().optional(),
	}),
});

export const collections = { projects, explore, resources, board, settings };
