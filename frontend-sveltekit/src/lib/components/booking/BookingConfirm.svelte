<script lang="ts">
	import type { TimeSlot, BookingConfig, PriceCalculation } from '$lib/api/booking';
	import { createBooking, calculatePrice } from '$lib/api/booking';
	import type { Booking } from '$lib/api/booking';

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
		date: string;
		slot: TimeSlot;
		config: BookingConfig;
		formData: BookingFormData;
		telegramUserId?: string;
		onSuccess: (booking: Booking) => void;
		onBack: () => void;
	}

	let { date, slot, config, formData, telegramUserId, onSuccess, onBack }: Props = $props();

	let submitting = $state(false);
	let error = $state('');
	let price = $state<PriceCalculation | null>(null);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
			'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
		return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
	}

	function typeLabel(type: string): string {
		return type === 'adult' ? 'Взрослый' : 'Детский';
	}

	async function handleConfirm() {
		submitting = true;
		error = '';

		try {
			const booking = await createBooking({
				slot_id: slot.id,
				duration: formData.duration,
				participant_count: formData.participantCount,
				contact_name: formData.contactName,
				contact_phone: formData.contactPhone,
				contact_email: formData.contactEmail || undefined,
				notes: formData.notes || undefined,
				telegram_user_id: telegramUserId
			});

			onSuccess(booking);
		} catch (e: any) {
			error = e.message || 'Ошибка при создании бронирования';
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		calculatePrice(slot.participant_type, formData.duration, formData.participantCount)
			.then(p => (price = p))
			.catch(e => console.error('Price error:', e));
	});
</script>

<div class="booking-confirm">
	<div class="confirm-header">
		<button class="back-btn" onclick={onBack}>‹ Назад</button>
		<h3 class="step-title">Подтверждение</h3>
	</div>

	<div class="summary-card">
		<div class="summary-row">
			<span class="summary-label">Дата</span>
			<span class="summary-value">{formatDate(date)}</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Время</span>
			<span class="summary-value">{slot.start_time}</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Тип заезда</span>
			<span class="summary-value">{typeLabel(slot.participant_type)}</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Длительность</span>
			<span class="summary-value">{formData.duration} мин</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Участники</span>
			<span class="summary-value">{formData.participantCount} чел.</span>
		</div>

		<div class="divider"></div>

		<div class="summary-row">
			<span class="summary-label">Имя</span>
			<span class="summary-value">{formData.contactName}</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Телефон</span>
			<span class="summary-value">{formData.contactPhone}</span>
		</div>
		{#if formData.contactEmail}
			<div class="summary-row">
				<span class="summary-label">Email</span>
				<span class="summary-value">{formData.contactEmail}</span>
			</div>
		{/if}
		{#if formData.notes}
			<div class="summary-row">
				<span class="summary-label">Комментарий</span>
				<span class="summary-value">{formData.notes}</span>
			</div>
		{/if}
	</div>

	{#if price}
		<div class="price-card">
			{#if price.group_discount_applied}
				<div class="price-row">
					<span>{formData.participantCount} × {price.price_per_person} ₽</span>
					<span>{price.subtotal} ₽</span>
				</div>
				<div class="price-row discount">
					<span>Скидка −{price.discount_percent}%</span>
					<span>−{price.discount_amount} ₽</span>
				</div>
			{/if}
			<div class="price-total">
				<span>К оплате</span>
				<span>{price.total} ₽</span>
			</div>
			<p class="payment-note">Оплата на месте</p>
		</div>
	{/if}

	{#if error}
		<div class="error-msg">{error}</div>
	{/if}

	<button
		class="confirm-btn"
		onclick={handleConfirm}
		disabled={submitting}
	>
		{#if submitting}
			Создание брони...
		{:else}
			Подтвердить бронь
		{/if}
	</button>
</div>

<style>
	.booking-confirm {
		padding: 16px;
	}

	.confirm-header {
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

	.summary-card {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
	}

	.summary-label {
		font-size: 13px;
		color: #b0b0b0;
	}

	.summary-value {
		font-size: 14px;
		color: #ffffff;
		font-weight: 500;
		text-align: right;
		max-width: 60%;
	}

	.divider {
		height: 1px;
		background: #333;
		margin: 8px 0;
	}

	.price-card {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
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

	.price-total {
		display: flex;
		justify-content: space-between;
		font-size: 20px;
		font-weight: 700;
		color: #ffffff;
		padding: 8px 0 4px;
		border-top: 1px solid #333;
		margin-top: 4px;
	}

	.payment-note {
		font-size: 12px;
		color: #666;
		margin: 4px 0 0;
		text-align: center;
	}

	.error-msg {
		background: rgba(255, 23, 68, 0.1);
		border: 1px solid #ff1744;
		border-radius: 12px;
		padding: 12px 16px;
		color: #ff1744;
		font-size: 14px;
		margin-bottom: 16px;
		text-align: center;
	}

	.confirm-btn {
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

	.confirm-btn:hover:not(:disabled) {
		background: #ff4569;
	}

	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
