<script lang="ts">
	import type { Booking } from '$lib/api/booking';

	interface Props {
		booking: Booking;
		onReset: () => void;
	}

	let { booking, onReset }: Props = $props();

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
			'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
		return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
	}

	function typeLabel(type: string): string {
		return type === 'adult' ? 'Взрослый' : 'Детский';
	}
</script>

<div class="booking-success">
	<div class="success-icon">&#10003;</div>
	<h3 class="success-title">Бронь создана!</h3>

	<div class="booking-number">
		<span class="number-label">Номер брони</span>
		<span class="number-value">#{booking.id}</span>
	</div>

	<div class="info-card">
		<div class="info-row">
			<span class="info-label">Дата</span>
			<span class="info-value">{formatDate(booking.date)}</span>
		</div>
		<div class="info-row">
			<span class="info-label">Время</span>
			<span class="info-value">{booking.start_time}</span>
		</div>
		<div class="info-row">
			<span class="info-label">Тип</span>
			<span class="info-value">{typeLabel(booking.participant_type)}</span>
		</div>
		<div class="info-row">
			<span class="info-label">Участники</span>
			<span class="info-value">{booking.participant_count} чел.</span>
		</div>
		<div class="info-row">
			<span class="info-label">Длительность</span>
			<span class="info-value">{booking.duration} мин</span>
		</div>
		<div class="info-row">
			<span class="info-label">Стоимость</span>
			<span class="info-value">{booking.total_price} ₽</span>
		</div>
		<div class="info-row">
			<span class="info-label">Статус</span>
			<span class="info-value status-badge">
				{booking.status === 'confirmed' ? 'Подтверждено' : 'Ожидает подтверждения'}
			</span>
		</div>
	</div>

	<div class="instructions">
		<p>Приезжайте за <strong>15 минут</strong> до начала заезда для инструктажа</p>
		<p>Оплата на месте</p>
	</div>

	<button class="reset-btn" onclick={onReset}>
		Забронировать ещё
	</button>
</div>

<style>
	.booking-success {
		padding: 16px;
		text-align: center;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #4caf50;
		color: #fff;
		font-size: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 16px auto;
	}

	.success-title {
		font-family: 'Unbounded', sans-serif;
		font-size: 22px;
		font-weight: 700;
		color: #ffffff;
		margin: 12px 0 20px;
	}

	.booking-number {
		background: #1a1a1a;
		border: 2px solid #ff1744;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.number-label {
		display: block;
		font-size: 12px;
		color: #b0b0b0;
		margin-bottom: 4px;
	}

	.number-value {
		font-family: 'Unbounded', sans-serif;
		font-size: 28px;
		font-weight: 700;
		color: #ff1744;
	}

	.info-card {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
		text-align: left;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
	}

	.info-label {
		font-size: 13px;
		color: #b0b0b0;
	}

	.info-value {
		font-size: 14px;
		color: #ffffff;
		font-weight: 500;
	}

	.status-badge {
		color: #4caf50;
	}

	.instructions {
		background: rgba(255, 152, 0, 0.1);
		border: 1px solid rgba(255, 152, 0, 0.3);
		border-radius: 12px;
		padding: 12px 16px;
		margin-bottom: 20px;
	}

	.instructions p {
		margin: 4px 0;
		font-size: 13px;
		color: #ff9800;
	}

	.reset-btn {
		width: 100%;
		padding: 14px;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 14px;
		color: #ffffff;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.reset-btn:hover {
		background: #3a3a3a;
	}
</style>
