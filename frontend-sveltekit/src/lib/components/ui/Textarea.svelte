<script lang="ts">
	interface Props {
		label?: string;
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		rows?: number;
		onInput?: (value: string) => void;
		class?: string;
	}

	let {
		label,
		placeholder = '',
		value = $bindable(),
		disabled = false,
		required = false,
		minLength,
		maxLength,
		rows = 4,
		onInput,
		class: className = ''
	}: Props = $props();

	// Handle undefined value
	const safeValue = $derived(value ?? '');

	const textareaId = `textarea-${Math.random().toString(36).substring(2, 9)}`;

	const handleInput = (e: Event) => {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		onInput?.(target.value);
	};
</script>

<div class="textarea-wrapper {className}">
	{#if label}
		<label class="textarea-label" for={textareaId}>
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</label>
	{/if}

	<textarea
		id={textareaId}
		{placeholder}
		{disabled}
		{required}
		{rows}
		minlength={minLength}
		maxlength={maxLength}
		value={safeValue}
		oninput={handleInput}
		class="textarea"
	></textarea>

	{#if maxLength}
		<div class="char-count">
			{safeValue.length} / {maxLength}
		</div>
	{/if}
</div>

<style>
	.textarea-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.textarea-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #ef4444;
	}

	.textarea {
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
		transition: all 0.2s;
	}

	.textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.textarea:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	.char-count {
		text-align: right;
		font-size: 0.75rem;
		color: #9ca3af;
	}
</style>
