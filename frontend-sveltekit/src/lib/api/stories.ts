/**
 * Public Stories API Client
 * Клиент для получения stories на фронтенде и записи просмотров
 *
 * NOTE: Types here are for PUBLIC API responses only.
 * For admin types, use $lib/types/stories.ts
 */

import { API_BASE_URL } from '$lib/config';

// API_BASE_URL already includes /api suffix
const API_URL = API_BASE_URL;

/** Public-facing settings (subset of admin settings) */
export interface StoriesSettings {
	shape: 'circle' | 'square';
	borderWidth: number;
	borderColor: string;
	borderGradient: { colors: string[]; angle: number } | null;
	showTitle: boolean;
	titlePosition: 'bottom' | 'inside';
	highlightSize: number;
}

/** Story item for public display */
export interface StoryItem {
	id: number;
	type: 'photo' | 'video';
	mediaUrl: string;
	thumbnailUrl: string | null;
	duration: number;
	linkUrl: string | null;
	linkText: string | null;
	position: number;
	createdAt: string;
}

/** Story highlight with items for public display */
export interface StoryHighlight {
	id: number;
	title: string;
	coverImage: string | null;
	position: number;
	updatedAt: string;
	items: StoryItem[];
}

/** Response from GET /api/stories */
export interface StoriesData {
	enabled: boolean;
	settings: StoriesSettings | null;
	highlights: StoryHighlight[];
}

/**
 * Fetch stories for display on frontend
 */
export async function fetchStories(): Promise<StoriesData> {
	const response = await fetch(`${API_URL}/stories`, {
		credentials: 'include'
	});

	const json = await response.json();

	if (!response.ok || !json.success) {
		throw new Error(json.error || 'Failed to fetch stories');
	}

	return json.data;
}

/**
 * Record a story view
 */
export async function recordView(params: {
	storyItemId: number;
	userId?: number | null;
	sessionId?: string | null;
	viewDuration?: number;
	completed?: boolean;
	linkClicked?: boolean;
}): Promise<void> {
	await fetch(`${API_URL}/stories/view`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(params)
	});
}

/**
 * Generate or get session ID for anonymous tracking
 */
export function getSessionId(): string {
	const key = 'stories_session_id';
	let sessionId = sessionStorage.getItem(key);

	if (!sessionId) {
		sessionId = 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
		sessionStorage.setItem(key, sessionId);
	}

	return sessionId;
}
