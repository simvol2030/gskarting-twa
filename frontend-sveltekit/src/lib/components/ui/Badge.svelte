<script lang="ts">
	interface Props {
		variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
		size?: 'sm' | 'md';
		class?: string;
		children?: any;
	}

	let { variant = 'primary', size = 'md', class: className = '', children }: Props = $props();
</script>

<span class="badge badge-{variant} badge-{size} {className}">
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		border-radius: 9999px;
		white-space: nowrap;
	}

	/* Sizes */
	.badge-sm {
		padding: 0.125rem 0.625rem;
		font-size: 0.75rem;
	}

	.badge-md {
		padding: 0.25rem 0.875rem;
		font-size: 0.875rem;
	}

	/* Variants */
	.badge-primary {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-success {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-danger {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-warning {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-info {
		background: #e0f2fe;
		color: #075985;
	}

	.badge-secondary {
		background: #f3f4f6;
		color: #4b5563;
	}
</style>
