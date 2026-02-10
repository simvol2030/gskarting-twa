<script lang="ts">
	import type { TimeSlot, BookingConfig, PriceCalculation } from '$lib/api/booking';
	import { calculatePrice } from '$lib/api/booking';

	interface BookingFormData {
		duration: number;
		participantCount: number;
		contactName: string;
		contactPhone: string;
		contactEmail: string;
		notes: string;
		acceptedRules: boolean;
		acceptedShift: boolean;
	}

	interface Props {
		slot: TimeSlot;
		config: BookingConfig;
		onSubmit: (data: BookingFormData) => void;
		onBack: () => void;
	}

	let { slot, config, onSubmit, onBack }: Props = $props();

	let duration = $state(config.default_duration);
	let participantCount = $state(1);
	let contactName = $state('');
	let contactPhone = $state('');
	let contactEmail = $state('');
	let notes = $state('');
	let acceptedRules = $state(false);
	let acceptedShift = $state(false);
	let price = $state<PriceCalculation | null>(null);
	let priceLoading = $state(false);
	let errors = $state<Record<string, string>>({});
	let submitted = $state(false);

	const maxParticipants = $derived(slot.available_spots);
	const durations: number[] = config.slot_durations;

	function formatPhone(value: string): string {
		const digits = value.replace(/\D/g, '');
		let formatted = '+7';
		if (digits.length > 1) formatted += ' (' + digits.substring(1, 4);
		if (digits.length > 4) formatted += ') ' + digits.substring(4, 7);
		if (digits.length > 7) formatted += '-' + digits.substring(7, 9);
		if (digits.length > 9) formatted += '-' + digits.substring(9, 11);
		return formatted;
	}

	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let digits = input.value.replace(/\D/g, '');

		// Ensure starts with 7
		if (digits.length === 0 || digits[0] !== '7') {
			if (digits[0] === '8') digits = '7' + digits.substring(1);
			else if (digits[0] !== '7') digits = '7' + digits;
		}

		// Limit to 11 digits
		digits = digits.substring(0, 11);
		contactPhone = formatPhone(digits);
	}

	function incrementCount() {
		if (participantCount < maxParticipants) {
			participantCount++;
			loadPrice();
		}
	}

	function decrementCount() {
		if (participantCount > 1) {
			participantCount--;
			loadPrice();
		}
	}

	function selectDuration(d: number) {
		duration = d;
		loadPrice();
	}

	async function loadPrice() {
		priceLoading = true;
		try {
			price = await calculatePrice(slot.participant_type, duration, participantCount);
		} catch (e: any) {
			console.error('Price calculation failed:', e);
		} finally {
			priceLoading = false;
		}
	}

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!contactName.trim()) newErrors.name = 'Введите имя';
		if (!contactPhone || contactPhone.replace(/\D/g, '').length < 11) newErrors.phone = 'Введите телефон';
		if (!acceptedRules) newErrors.rules = 'Примите правила';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit() {
		submitted = true;
		if (!validate()) return;

		onSubmit({
			duration,
			participantCount,
			contactName: contactName.trim(),
			contactPhone: contactPhone.trim(),
			contactEmail: contactEmail.trim(),
			notes: notes.trim(),
			acceptedRules,
			acceptedShift
		});
	}

	// Load initial price
	$effect(() => {
		loadPrice();
	});
</script>

<div class="booking-details">
	<div class="details-header">
		<button class="back-btn" onclick={onBack}>‹ Назад</button>
		<h3 class="step-title">Детали заезда</h3>
	</div>

	<!-- Duration -->
	<div class="form-section">
		<label class="section-label">Длительность заезда</label>
		<div class="duration-options">
			{#each durations as d}
				<button
					class="duration-btn"
					class:active={duration === d}
					onclick={() => selectDuration(d)}
				>
					{d} мин
				</button>
			{/each}
		</div>
	</div>

	<!-- Participants -->
	<div class="form-section">
		<label class="section-label">Участники</label>
		<div class="counter">
			<button class="counter-btn" onclick={decrementCount} disabled={participantCount <= 1}>−</button>
			<span class="counter-value">{participantCount}</span>
			<button class="counter-btn" onclick={incrementCount} disabled={participantCount >= maxParticipants}>+</button>
		</div>
		<span class="counter-hint">Доступно мест: {maxParticipants}</span>
	</div>

	<!-- Contact form -->
	<div class="form-section">
		<label class="section-label">Контакты</label>

		<div class="input-group">
			<input
				type="text"
				class="input"
				class:error={submitted && errors.name}
				placeholder="Имя *"
				bind:value={contactName}
			/>
			{#if submitted && errors.name}
				<span class="error-text">{errors.name}</span>
			{/if}
		</div>

		<div class="input-group">
			<input
				type="tel"
				class="input"
				class:error={submitted && errors.phone}
				placeholder="+7 (___) ___-__-__"
				value={contactPhone}
				oninput={handlePhoneInput}
			/>
			{#if submitted && errors.phone}
				<span class="error-text">{errors.phone}</span>
			{/if}
		</div>

		<div class="input-group">
			<input
				type="email"
				class="input"
				placeholder="Email (необязательно)"
				bind:value={contactEmail}
			/>
		</div>

		<div class="input-group">
			<textarea
				class="input textarea"
				placeholder="Комментарий (необязательно)"
				bind:value={notes}
				rows="2"
			></textarea>
		</div>
	</div>

	<!-- Checkboxes -->
	<div class="form-section">
		<label class="checkbox-label" class:error={submitted && errors.rules}>
			<input type="checkbox" bind:checked={acceptedRules} />
			<span>Принимаю правила картинг-центра *</span>
		</label>

		<label class="checkbox-label">
			<input type="checkbox" bind:checked={acceptedShift} />
			<span>Согласен на возможное смещение времени</span>
		</label>
	</div>

	<!-- Price -->
	{#if price}
		<div class="price-block">
			<div class="price-row">
				<span>Цена за участника</span>
				<span>{price.price_per_person} ₽</span>
			</div>
			<div class="price-row">
				<span>{participantCount} × {price.price_per_person} ₽</span>
				<span>{price.subtotal} ₽</span>
			</div>
			{#if price.group_discount_applied}
				<div class="price-row discount">
					<span>Групповая скидка −{price.discount_percent}%</span>
					<span>−{price.discount_amount} ₽</span>
				</div>
			{/if}
			<div class="price-row total">
				<span>Итого</span>
				<span>{price.total} ₽</span>
			</div>
		</div>
	{:else if priceLoading}
		<div class="price-block loading">Расчёт стоимости...</div>
	{/if}

	<button class="submit-btn" onclick={handleSubmit}>
		Далее
	</button>
</div>

<style>
	.booking-details {
		padding: 16px;
	}

	.details-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}

	.back-btn {
		background: #2a2a2a;
		border: 1px solid #444;
		color: #ffffff;
		padding: 8px 12px;
		border-radius: 10px;
		cursor: pointer;
		font-size: 14px;
	}

	.back-btn:hover {
		background: #3a3a3a;
	}

	.step-title {
		font-family: 'Unbounded', sans-serif;
		font-size: 16px;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.form-section {
		margin-bottom: 20px;
	}

	.section-label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #b0b0b0;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.duration-options {
		display: flex;
		gap: 8px;
	}

	.duration-btn {
		flex: 1;
		padding: 12px;
		border: 1px solid #444;
		background: #1a1a1a;
		color: #ffffff;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.duration-btn.active {
		background: #ff1744;
		border-color: #ff1744;
	}

	.counter {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.counter-btn {
		width: 40px;
		height: 40px;
		border: 1px solid #444;
		background: #1a1a1a;
		color: #ffffff;
		border-radius: 10px;
		font-size: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.counter-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.counter-value {
		font-size: 24px;
		font-weight: 700;
		color: #ffffff;
		min-width: 40px;
		text-align: center;
	}

	.counter-hint {
		display: block;
		font-size: 12px;
		color: #666;
		margin-top: 4px;
	}

	.input-group {
		margin-bottom: 12px;
	}

	.input {
		width: 100%;
		padding: 12px 16px;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 12px;
		color: #ffffff;
		font-size: 14px;
		outline: none;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.input:focus {
		border-color: #ff1744;
	}

	.input.error {
		border-color: #ff1744;
	}

	.input::placeholder {
		color: #666;
	}

	.textarea {
		resize: vertical;
		min-height: 60px;
	}

	.error-text {
		display: block;
		font-size: 12px;
		color: #ff1744;
		margin-top: 4px;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-bottom: 8px;
		cursor: pointer;
		font-size: 13px;
		color: #b0b0b0;
	}

	.checkbox-label.error span {
		color: #ff1744;
	}

	.checkbox-label input[type='checkbox'] {
		margin-top: 2px;
		accent-color: #ff1744;
	}

	.price-block {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.price-block.loading {
		text-align: center;
		color: #666;
		font-size: 14px;
	}

	.price-row {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: #b0b0b0;
		padding: 4px 0;
	}

	.price-row.discount {
		color: #4caf50;
	}

	.price-row.total {
		border-top: 1px solid #333;
		margin-top: 8px;
		padding-top: 8px;
		font-size: 18px;
		font-weight: 700;
		color: #ffffff;
	}

	.submit-btn {
		width: 100%;
		padding: 16px;
		background: #ff1744;
		border: none;
		border-radius: 14px;
		color: #ffffff;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.2s;
	}

	.submit-btn:hover {
		background: #ff4569;
	}
</style>
