<script lang="ts">
	import type { DateStatus, BookingConfig } from '$lib/api/booking';
	import { getScheduleRange } from '$lib/api/booking';

	interface Props {
		config: BookingConfig;
		onSelectDate: (date: string) => void;
	}

	let { config, onSelectDate }: Props = $props();

	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());
	let selectedDate = $state('');
	let loading = $state(false);
	let dateStatuses = $state<Record<string, DateStatus>>({});

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

	const monthNames = [
		'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
		'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
	];

	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfWeek(year: number, month: number): number {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1; // Monday = 0
	}

	function formatDate(year: number, month: number, day: number): string {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	function isPastDate(year: number, month: number, day: number): boolean {
		const date = new Date(year, month, day);
		return date < today;
	}

	function isWithinHorizon(year: number, month: number, day: number): boolean {
		const date = new Date(year, month, day);
		const maxDate = new Date(today);
		maxDate.setDate(maxDate.getDate() + config.booking_horizon_days);
		return date <= maxDate;
	}

	function canGoBack(): boolean {
		return currentYear > today.getFullYear() || (currentYear === today.getFullYear() && currentMonth > today.getMonth());
	}

	function canGoForward(): boolean {
		const maxDate = new Date(today);
		maxDate.setDate(maxDate.getDate() + config.booking_horizon_days);
		return currentYear < maxDate.getFullYear() || (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth());
	}

	function goBack() {
		if (!canGoBack()) return;
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
		loadMonthData();
	}

	function goForward() {
		if (!canGoForward()) return;
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
		loadMonthData();
	}

	function selectDate(year: number, month: number, day: number) {
		if (isPastDate(year, month, day) || !isWithinHorizon(year, month, day)) return;

		const dateStr = formatDate(year, month, day);
		const status = dateStatuses[dateStr];
		if (status?.status === 'closed' || status?.status === 'booked') return;

		selectedDate = dateStr;
		onSelectDate(dateStr);
	}

	function getDateIndicator(year: number, month: number, day: number): string {
		const dateStr = formatDate(year, month, day);
		const status = dateStatuses[dateStr];
		if (!status) return '';
		return status.status;
	}

	async function loadMonthData() {
		loading = true;
		try {
			const daysInMonth = getDaysInMonth(currentYear, currentMonth);
			const from = formatDate(currentYear, currentMonth, 1);
			const to = formatDate(currentYear, currentMonth, daysInMonth);
			const result = await getScheduleRange(from, to);
			dateStatuses = { ...dateStatuses, ...result.dates };
		} catch (error) {
			console.error('Failed to load schedule range:', error);
		} finally {
			loading = false;
		}
	}

	// Load initial month
	$effect(() => {
		loadMonthData();
	});
</script>

<div class="booking-calendar">
	<div class="calendar-header">
		<button class="nav-btn" onclick={goBack} disabled={!canGoBack()}>‹</button>
		<span class="month-title">{monthNames[currentMonth]} {currentYear}</span>
		<button class="nav-btn" onclick={goForward} disabled={!canGoForward()}>›</button>
	</div>

	<div class="weekdays">
		{#each weekDays as day}
			<div class="weekday">{day}</div>
		{/each}
	</div>

	<div class="days-grid" class:loading>
		{#each Array(getFirstDayOfWeek(currentYear, currentMonth)) as _}
			<div class="day-cell empty"></div>
		{/each}

		{#each Array(getDaysInMonth(currentYear, currentMonth)) as _, i}
			{@const day = i + 1}
			{@const dateStr = formatDate(currentYear, currentMonth, day)}
			{@const past = isPastDate(currentYear, currentMonth, day)}
			{@const outOfRange = !isWithinHorizon(currentYear, currentMonth, day)}
			{@const indicator = getDateIndicator(currentYear, currentMonth, day)}
			{@const disabled = past || outOfRange || indicator === 'closed' || indicator === 'booked'}
			{@const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate())}
			{@const isSelected = dateStr === selectedDate}

			<button
				class="day-cell"
				class:past
				class:disabled
				class:today={isToday}
				class:selected={isSelected}
				class:available={indicator === 'available'}
				class:limited={indicator === 'limited'}
				class:booked={indicator === 'booked'}
				class:closed={indicator === 'closed'}
				onclick={() => selectDate(currentYear, currentMonth, day)}
				{disabled}
			>
				<span class="day-number">{day}</span>
				{#if indicator && !past && !outOfRange}
					<span class="indicator indicator-{indicator}"></span>
				{/if}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="loading-overlay">
			<div class="spinner"></div>
		</div>
	{/if}

	<div class="legend">
		<span class="legend-item"><span class="dot dot-available"></span> Свободно</span>
		<span class="legend-item"><span class="dot dot-limited"></span> Мало мест</span>
		<span class="legend-item"><span class="dot dot-booked"></span> Нет мест</span>
	</div>
</div>

<style>
	.booking-calendar {
		position: relative;
		padding: 16px;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.month-title {
		font-family: 'Unbounded', sans-serif;
		font-size: 18px;
		font-weight: 700;
		color: #ffffff;
	}

	.nav-btn {
		background: #2a2a2a;
		border: 1px solid #444;
		color: #ffffff;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s;
	}

	.nav-btn:hover:not(:disabled) {
		background: #3a3a3a;
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		margin-bottom: 8px;
	}

	.weekday {
		text-align: center;
		font-size: 12px;
		color: #b0b0b0;
		font-weight: 500;
		padding: 4px 0;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		transition: opacity 0.2s;
	}

	.days-grid.loading {
		opacity: 0.5;
	}

	.day-cell {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		position: relative;
		padding: 0;
		transition: all 0.2s;
	}

	.day-cell.empty {
		cursor: default;
	}

	.day-cell:hover:not(.disabled):not(.empty) {
		background: #2a2a2a;
	}

	.day-cell.past,
	.day-cell.disabled {
		cursor: not-allowed;
		opacity: 0.3;
	}

	.day-cell.today {
		border-color: #666;
	}

	.day-cell.selected {
		background: #ff1744;
		border-color: #ff1744;
	}

	.day-cell.selected .day-number {
		color: #ffffff;
		font-weight: 700;
	}

	.day-number {
		font-size: 14px;
		color: #ffffff;
		font-weight: 400;
	}

	.indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		margin-top: 2px;
	}

	.indicator-available {
		background: #4caf50;
	}

	.indicator-limited {
		background: #ff9800;
	}

	.indicator-booked {
		background: #666666;
	}

	.indicator-closed {
		background: #444444;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #333;
		border-top-color: #ff1744;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.legend {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-top: 12px;
		font-size: 11px;
		color: #b0b0b0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.dot-available {
		background: #4caf50;
	}

	.dot-limited {
		background: #ff9800;
	}

	.dot-booked {
		background: #666666;
	}
</style>
