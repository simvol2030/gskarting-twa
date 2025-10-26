<script lang="ts">
	/**
	 * Standalone Layout for Cashier Interface
	 *
	 * This layout overrides the main application layout to create
	 * an isolated interface for the Electron-based cashier app.
	 *
	 * Features:
	 * - No Header/Footer from main app
	 * - Full viewport usage
	 * - Optimized for 1/3 screen × 1/3 screen window
	 * - No scrolling (fixed dimensions)
	 */

	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background-color: #f5f5f5;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* Remove any default margins and paddings */
	:global(html) {
		margin: 0;
		padding: 0;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	/* Ensure the cashier interface fills the entire window */
	:global(#svelte) {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
</style>
