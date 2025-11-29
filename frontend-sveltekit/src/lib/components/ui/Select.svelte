<script lang="ts">
	interface SelectOption {
		value: string | number;
		label: string;
	}

	interface Props {
		label?: string;
		value?: string | number | null;
		options: SelectOption[];
		disabled?: boolean;
		required?: boolean;
		onChange?: (value: string | number) => void;
		class?: string;
	}

	let {
		label,
		value = $bindable(null),
		options,
		disabled = false,
		required = false,
		onChange,
		class: className = ''
	}: Props = $props();

	const selectId = `select-${Math.random().toString(36).substring(2, 9)}`;

	const handleChange = (e: Event) => {
		const target = e.target as HTMLSelectElement;
		const newValue = target.value;
		value = isNaN(Number(newValue)) ? newValue : Number(newValue);
		onChange?.(value);
	};
</script>

<div class="select-wrapper {className}">
	{#if label}
		<label class="select-label" for={selectId}>
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</label>
	{/if}

	<select id={selectId} class="select" {disabled} {required} value={value || ''} onchange={handleChange}>
		{#each options as option (option.value)}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>
</div>

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.select-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #ef4444;
	}

	.select {
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.select:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
</style>
