/**
 * Web Stories Types
 * Типы для управления историями (highlights, items, settings, analytics)
 */

// =====================================================
// HIGHLIGHTS (Группы историй)
// =====================================================

export interface StoriesHighlight {
	id: number;
	title: string;
	coverImage: string | null;
	position: number;
	isActive: boolean;
	itemsCount?: number; // Количество items (для списка)
	createdAt: string;
	updatedAt: string;
}

export interface StoriesHighlightFormData {
	title: string;
	coverImage: string | null;
	isActive: boolean;
}

export interface StoriesHighlightWithItems extends StoriesHighlight {
	items: StoryItem[];
}

// =====================================================
// STORY ITEMS (Контент внутри хайлайта)
// =====================================================

export interface StoryItem {
	id: number;
	highlightId: number;
	type: 'photo' | 'video';
	mediaUrl: string;
	thumbnailUrl: string | null;
	duration: number; // секунды
	linkUrl: string | null;
	linkText: string | null;
	position: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface StoryItemFormData {
	highlightId: number;
	type: 'photo' | 'video';
	mediaUrl: string;
	thumbnailUrl?: string | null;
	duration: number;
	linkUrl?: string | null;
	linkText?: string | null;
	isActive: boolean;
}

// =====================================================
// SETTINGS (Настройки отображения)
// =====================================================

export interface StoriesSettings {
	enabled: boolean;
	shape: 'circle' | 'square';
	borderWidth: number;
	borderColor: string;
	borderGradient: StoriesGradient | null;
	showTitle: boolean;
	titlePosition: 'bottom' | 'inside';
	highlightSize: number; // px
	maxVideoDuration: number; // секунды
	maxVideoSizeMb: number;
	autoConvertWebp: boolean;
	webpQuality: number; // 1-100
}

export interface StoriesGradient {
	colors: string[];
	angle: number; // градусы, default 135
}

// =====================================================
// ANALYTICS (Аналитика просмотров)
// =====================================================

export interface StoryView {
	id: number;
	storyItemId: number;
	userId: number | null;
	sessionId: string | null;
	viewDuration: number; // секунды
	completed: boolean;
	linkClicked: boolean;
	createdAt: string;
}

export interface StoriesAnalytics {
	totalViews: number;
	uniqueViewers: number;
	avgViewDuration: number; // секунды
	completionRate: number; // 0-100%
	linkClickRate: number; // 0-100%
	viewsByDay: StoriesViewsByDay[];
	topHighlights: StoriesTopHighlight[];
	topItems: StoriesTopItem[];
}

export interface StoriesViewsByDay {
	date: string; // YYYY-MM-DD
	views: number;
	uniqueViewers: number;
}

export interface StoriesTopHighlight {
	id: number;
	title: string;
	views: number;
	completionRate: number;
}

export interface StoriesTopItem {
	id: number;
	highlightId: number;
	highlightTitle: string;
	mediaUrl: string;
	type: 'photo' | 'video';
	views: number;
	avgDuration: number;
	linkClicks: number;
}

export interface HighlightAnalytics {
	highlightId: number;
	title: string;
	totalViews: number;
	uniqueViewers: number;
	avgViewDuration: number;
	completionRate: number;
	linkClickRate: number;
	itemsAnalytics: StoryItemAnalytics[];
}

export interface StoryItemAnalytics {
	itemId: number;
	type: 'photo' | 'video';
	mediaUrl: string;
	views: number;
	uniqueViewers: number;
	avgDuration: number;
	completionRate: number;
	linkClicks: number;
}

// =====================================================
// API RESPONSES
// =====================================================

export interface StoriesListResponse {
	highlights: StoriesHighlight[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface StoriesPublicResponse {
	enabled: boolean;
	settings: Pick<StoriesSettings, 'shape' | 'borderWidth' | 'borderColor' | 'borderGradient' | 'showTitle' | 'titlePosition' | 'highlightSize'>;
	highlights: StoriesHighlightWithItems[];
}

export interface UploadMediaResponse {
	url: string;
	thumbnailUrl?: string;
	filename: string;
	type: 'photo' | 'video';
	duration?: number; // для видео
	size: number; // bytes
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export interface BulkStatusUpdate {
	ids: number[];
	isActive: boolean;
}

export interface ReorderItem {
	id: number;
	position: number;
}

// =====================================================
// ZUCK.JS INTEGRATION TYPES
// =====================================================

/**
 * Формат данных для библиотеки zuck.js
 */
export interface ZuckTimelineItem {
	id: string;
	photo: string; // cover image
	name: string; // title
	link?: string;
	lastUpdated: number; // timestamp
	seen: boolean;
	items: ZuckStoryItem[];
}

export interface ZuckStoryItem {
	id: string;
	type: 'photo' | 'video';
	src: string;
	preview?: string;
	link?: string;
	linkText?: string;
	time: number; // timestamp
	length: number; // duration in seconds
}

/**
 * Конвертер из нашего формата в формат zuck.js
 */
export function convertToZuckFormat(highlights: StoriesHighlightWithItems[]): ZuckTimelineItem[] {
	return highlights.map(highlight => ({
		id: `highlight-${highlight.id}`,
		photo: highlight.coverImage || '/placeholder-story.png',
		name: highlight.title,
		lastUpdated: new Date(highlight.updatedAt).getTime() / 1000,
		seen: false,
		items: highlight.items
			.filter(item => item.isActive)
			.sort((a, b) => a.position - b.position)
			.map(item => ({
				id: `item-${item.id}`,
				type: item.type,
				src: item.mediaUrl,
				preview: item.thumbnailUrl || undefined,
				link: item.linkUrl || undefined,
				linkText: item.linkText || undefined,
				time: new Date(item.createdAt).getTime() / 1000,
				length: item.duration
			}))
	}));
}
