<script lang="ts">
	import { onMount } from 'svelte';
	import type { BookingConfig, TimeSlot, Booking } from '$lib/api/booking';
	import { getConfig } from '$lib/api/booking';
	import BookingCalendar from './BookingCalendar.svelte';
	import BookingSlots from './BookingSlots.svelte';
	import BookingDetails from './BookingDetails.svelte';
	import BookingConfirm from './BookingConfirm.svelte';
	import BookingSuccess from './BookingSuccess.svelte';

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
		mode: 'twa' | 'standalone';
		telegramUserId?: string;
		compact?: boolean;
	}

	let { mode = 'standalone', telegramUserId, compact = false }: Props = $props();

	let step = $state(1);
	let config = $state<BookingConfig | null>(null);
	let loading = $state(true);
	let error = $state('');

	// State across steps
	let selectedDate = $state('');
	let selectedSlot = $state<TimeSlot | null>(null);
	let formData = $state<BookingFormData | null>(null);
	let completedBooking = $state<Booking | null>(null);

	const stepLabels = ['Дата', 'Время', 'Детали', 'Подтверждение', 'Готово'];

	function handleDateSelect(date: string) {
		selectedDate = date;
		step = 2;
	}

	function handleSlotSelect(slot: TimeSlot) {
		selectedSlot = slot;
		step = 3;
	}

	function handleDetailsSubmit(data: BookingFormData) {
		formData = data;
		step = 4;
	}

	function handleBookingSuccess(booking: Booking) {
		completedBooking = booking;
		step = 5;
	}

	function handleReset() {
		step = 1;
		selectedDate = '';
		selectedSlot = null;
		formData = null;
		completedBooking = null;
	}

	function goToStep(s: number) {
		if (s >= step) return; // Can only go back
		step = s;
	}

	onMount(async () => {
		try {
			config = await getConfig();
		} catch (e: any) {
			error = e.message || 'Не удалось загрузить конфигурацию';
		} finally {
			loading = false;
		}
	});
</script>

<div class="booking-widget" class:compact class:standalone={mode === 'standalone'}>
	{#if mode === 'twa'}
		<h2 class="widget-title">Забронировать заезд</h2>
	{/if}

	{#if loading}
		<div class="widget-loading">
			<div class="spinner"></div>
			<p>Загрузка...</p>
		</div>
	{:else if error}
		<div class="widget-error">
			<p>{error}</p>
		</div>
	{:else if config}
		<!-- Step indicator -->
		{#if step < 5}
			<div class="step-indicator">
				{#each stepLabels.slice(0, 4) as label, i}
					<button
						class="step-dot"
						class:active={step === i + 1}
						class:completed={step > i + 1}
						class:clickable={step > i + 1}
						onclick={() => goToStep(i + 1)}
						disabled={step <= i + 1}
					>
						{#if step > i + 1}
							<span class="check">&#10003;</span>
						{:else}
							{i + 1}
						{/if}
					</button>
					{#if i < 3}
						<div class="step-line" class:active={step > i + 1}></div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Step content -->
		<div class="step-content">
			{#if step === 1}
				<BookingCalendar {config} onSelectDate={handleDateSelect} />
			{:else if step === 2 && selectedDate}
				<BookingSlots
					date={selectedDate}
					{config}
					onSelectSlot={handleSlotSelect}
					onBack={() => (step = 1)}
				/>
			{:else if step === 3 && selectedSlot}
				<BookingDetails
					slot={selectedSlot}
					{config}
					onSubmit={handleDetailsSubmit}
					onBack={() => (step = 2)}
				/>
			{:else if step === 4 && selectedSlot && formData}
				<BookingConfirm
					date={selectedDate}
					slot={selectedSlot}
					{config}
					{formData}
					{telegramUserId}
					onSuccess={handleBookingSuccess}
					onBack={() => (step = 3)}
				/>
			{:else if step === 5 && completedBooking}
				<BookingSuccess
					booking={completedBooking}
					onReset={handleReset}
				/>
			{/if}
		</div>
	{/if}
</div>

<style>
	.booking-widget {
		background: #0a0a0a;
		border-radius: 20px;
		overflow: hidden;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		color: #ffffff;
	}

	.booking-widget.standalone {
		max-width: 480px;
		margin: 0 auto;
		min-height: 400px;
	}

	.widget-title {
		font-family: 'Unbounded', sans-serif;
		font-size: 20px;
		font-weight: 700;
		color: #ffffff;
		padding: 20px 16px 0;
		margin: 0;
	}

	.widget-loading,
	.widget-error {
		padding: 60px 16px;
		text-align: center;
		color: #b0b0b0;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #333;
		border-top-color: #ff1744;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 12px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.step-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px 24px 0;
		gap: 0;
	}

	.step-dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #2a2a2a;
		border: 2px solid #555;
		color: #aaa;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
		transition: all 0.3s;
		flex-shrink: 0;
		padding: 0;
	}

	.step-dot.active {
		background: #ff1744;
		border-color: #ff1744;
		color: #fff;
	}

	.step-dot.completed {
		background: #4caf50;
		border-color: #4caf50;
		color: #fff;
	}

	.step-dot.clickable {
		cursor: pointer;
	}

	.check {
		font-size: 14px;
	}

	.step-line {
		flex: 1;
		height: 2px;
		background: #333;
		min-width: 20px;
		max-width: 60px;
		transition: background 0.3s;
	}

	.step-line.active {
		background: #4caf50;
	}

	.step-content {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
