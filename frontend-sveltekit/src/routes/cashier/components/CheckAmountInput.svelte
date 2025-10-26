<script lang="ts">
	interface Props {
		value: string;
		onSubmit: () => void;
		onCancel: () => void;
	}

	let { value = $bindable(''), onSubmit, onCancel }: Props = $props();

	let isValid = $derived(value !== '' && parseFloat(value) > 0);
</script>

<div class="card">
	<h3 class="mb-2">Сумма чека</h3>
	<input
		bind:value
		class="input mb-2"
		type="number"
		placeholder="Введите сумму чека..."
		step="0.01"
		min="0"
		onkeydown={(e) => e.key === 'Enter' && isValid && onSubmit()}
	/>
	<button
		class="btn btn-primary"
		onclick={onSubmit}
		disabled={!isValid}
	>
		Продолжить
	</button>
</div>

<button class="btn btn-secondary mt-2" onclick={onCancel}>
	Отмена
</button>
