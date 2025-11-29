<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		label?: string;
		placeholder?: string;
		value?: string | number;
		icon?: string;
		disabled?: boolean;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		min?: number;
		max?: number;
		step?: string | number;
		onInput?: (value: string) => void;
		class?: string;
	}

	let {
		type = 'text',
		label,
		placeholder = '',
		value = $bindable(),
		icon,
		disabled = false,
		required = false,
		minLength,
		maxLength,
		min,
		max,
		step,
		onInput,
		class: className = ''
	}: Props = $props();

	const inputId = `input-${Math.random().toString(36).substring(2, 9)}`;

	// Handle undefined value
	const safeValue = $derived(value ?? '');

	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		value = type === 'number' ? Number(target.value) : target.value;
		onInput?.(target.value);
	};
</script>

<div class="input-wrapper {className}">
	{#if label}
		<label class="input-label" for={inputId}>
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</label>
	{/if}

	<div class="input-container">
		{#if icon}
			<span class="input-icon">{icon}</span>
		{/if}

		<input
			id={inputId}
			{type}
			{placeholder}
			{disabled}
			{required}
			{min}
			{max}
			{step}
			minlength={minLength}
			maxlength={maxLength}
			value={safeValue}
			oninput={handleInput}
			class="input"
			class:with-icon={icon}
		/>
	</div>
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #ef4444;
	}

	.input-container {
		position: relative;
	}

	.input-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.125rem;
		pointer-events: none;
	}

	.input {
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		transition: all 0.2s;
		font-family: inherit;
	}

	.input.with-icon {
		padding-left: 2.75rem;
	}

	.input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
</style>
