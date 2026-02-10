<script lang="ts">
	import { page } from '$app/stores';

	let { children }: { children: any } = $props();

	const tabs = [
		{ href: '/bookings', label: 'Dashboard', exact: true },
		{ href: '/bookings/list', label: 'Список', exact: false },
		{ href: '/bookings/slots', label: 'Слоты', exact: false },
		{ href: '/bookings/settings', label: 'Настройки', exact: false }
	];
</script>

<div class="bookings-layout">
	<nav class="bookings-tabs">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="tab"
				class:active={tab.exact ? $page.url.pathname === tab.href : $page.url.pathname.startsWith(tab.href)}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<div class="bookings-content">
		{@render children()}
	</div>
</div>

<style>
	.bookings-layout {
		width: 100%;
	}

	.bookings-tabs {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #e5e7eb;
		margin-bottom: 1.5rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.tab {
		padding: 0.75rem 1.25rem;
		text-decoration: none;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		white-space: nowrap;
		transition: all 0.2s;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.tab:hover {
		color: #374151;
	}

	.tab.active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	.bookings-content {
		width: 100%;
	}

	@media (max-width: 480px) {
		.tab {
			padding: 0.625rem 0.75rem;
			font-size: 0.8125rem;
		}
	}
</style>
