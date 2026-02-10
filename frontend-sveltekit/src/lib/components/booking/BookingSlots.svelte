<script lang="ts">
	import type { TimeSlot, BookingConfig } from '$lib/api/booking';
	import { getSchedule } from '$lib/api/booking';

	interface Props {
		date: string;
		config: BookingConfig;
		onSelectSlot: (slot: TimeSlot) => void;
		onBack: () => void;
	}

	let { date, config, onSelectSlot, onBack }: Props = $props();

	let participantType = $state<'adult' | 'child'>('adult');
	let slots = $state<TimeSlot[]>([]);
	let loading = $state(true);
	let error = $state('');
	let isClosed = $state(false);

	const filteredSlots = $derived(
		slots.filter(s => s.participant_type === participantType)
	);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
		const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
			'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
		return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;
	}

	async function loadSlots() {
		loading = true;
		error = '';
		try {
			const schedule = await getSchedule(date);
			slots = schedule.slots;
			isClosed = schedule.is_closed;

			// If all slots are adult (current config), show all regardless of toggle
			const hasChildSlots = slots.some(s => s.participant_type === 'child');
			if (!hasChildSlots && participantType === 'child') {
				participantType = 'adult';
			}
		} catch (e: any) {
			error = e.message || 'Ошибка загрузки слотов';
		} finally {
			loading = false;
		}
	}

	function handleSlotClick(slot: TimeSlot) {
		if (slot.status === 'booked' || slot.status === 'blocked' || slot.available_spots === 0) return;
		onSelectSlot(slot);
	}

	$effect(() => {
		loadSlots();
	});
</script>

<div class="booking-slots">
	<div class="slots-header">
		<button class="back-btn" onclick={onBack}>‹ Назад</button>
		<h3 class="date-title">{formatDate(date)}</h3>
	</div>

	<div class="type-toggle">
		<button
			class="toggle-btn"
			class:active={participantType === 'adult'}
			onclick={() => (participantType = 'adult')}
		>
			Взрослые (от {config.adult_min_age})
		</button>
		<button
			class="toggle-btn"
			class:active={participantType === 'child'}
			onclick={() => (participantType = 'child')}
		>
			Дети ({config.child_min_age}–{config.child_max_age})
		</button>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Загрузка слотов...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<button class="retry-btn" onclick={loadSlots}>Попробовать снова</button>
		</div>
	{:else if isClosed || filteredSlots.length === 0}
		<div class="empty-state">
			<p>В этот день нет доступных слотов</p>
		</div>
	{:else}
		<div class="slots-grid">
			{#each filteredSlots as slot}
				{@const full = slot.available_spots === 0}
				<button
					class="slot-card"
					class:available={slot.status === 'available'}
					class:limited={slot.status === 'limited'}
					class:booked={full}
					disabled={full}
					onclick={() => handleSlotClick(slot)}
				>
					<span class="slot-time">{slot.start_time}</span>
					<span class="slot-spots">
						{#if full}
							Нет мест
						{:else}
							{slot.available_spots} мест
						{/if}
					</span>
					{#if slot.shift_minutes > 0}
						<span class="slot-shift">+{slot.shift_minutes} мин</span>
					{/if}
				</button>
			{/each}
		</div>

		<p class="shift-note">Время заезда может незначительно сместиться</p>
	{/if}
</div>

<style>
	.booking-slots {
		padding: 16px;
		padding-bottom: 90px;
	}

	.slots-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.back-btn {
		background: #2a2a2a;
		border: 1px solid #444;
		color: #ffffff;
		padding: 8px 12px;
		border-radius: 10px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	.back-btn:hover {
		background: #3a3a3a;
	}

	.date-title {
		font-family: 'Unbounded', sans-serif;
		font-size: 16px;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.type-toggle {
		display: flex;
		background: #1a1a1a;
		border-radius: 12px;
		padding: 4px;
		margin-bottom: 16px;
		border: 1px solid #333;
	}

	.toggle-btn {
		flex: 1;
		padding: 10px;
		border: none;
		background: transparent;
		color: #b0b0b0;
		font-size: 13px;
		font-weight: 500;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn.active {
		background: #ff1744;
		color: #ffffff;
	}

	.slots-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 12px;
	}

	@media (min-width: 500px) {
		.slots-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.slot-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 8px;
		border-radius: 12px;
		border: 1px solid #333;
		background: #1a1a1a;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.slot-card:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.slot-card.available {
		border-color: #4caf50;
	}

	.slot-card.limited {
		border-color: #ff9800;
	}

	.slot-card.booked {
		border-color: #444;
		opacity: 0.4;
		cursor: not-allowed;
	}

	.slot-time {
		font-size: 16px;
		font-weight: 700;
		color: #ffffff;
	}

	.slot-spots {
		font-size: 11px;
		color: #b0b0b0;
		margin-top: 4px;
	}

	.slot-shift {
		position: absolute;
		top: -6px;
		right: -6px;
		background: #ff9800;
		color: #000;
		font-size: 9px;
		font-weight: 700;
		padding: 2px 5px;
		border-radius: 6px;
	}

	.shift-note {
		text-align: center;
		font-size: 12px;
		color: #666;
		margin: 0;
	}

	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 40px 16px;
		color: #b0b0b0;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #333;
		border-top-color: #ff1744;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 12px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.retry-btn {
		background: #ff1744;
		border: none;
		color: #fff;
		padding: 10px 20px;
		border-radius: 10px;
		cursor: pointer;
		margin-top: 12px;
		font-size: 14px;
	}
</style>
