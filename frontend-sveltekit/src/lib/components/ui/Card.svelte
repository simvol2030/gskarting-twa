<script lang="ts">
	interface Props {
		class?: string;
		children?: any;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="card {className}">
	{@render children?.()}
</div>

<style>
	.card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		transition: all 0.2s;
	}

	.card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
</style>
