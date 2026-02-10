<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { bookingAdminAPI, type DashboardData, type BookingSlot, type BookingItem, type ShiftPreview } from '$lib/api/admin/booking';

	let dashboardData = $state<DashboardData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let selectedDate = $state(new Date().toISOString().split('T')[0]);

	// Chronometer state
	let now = $state(new Date());
	let chronoInterval: ReturnType<typeof setInterval> | null = null;

	// Working hours (parsed from config, fallback to default)
	let workingHoursStart = $state('11:00');
	let workingHoursEnd = $state('22:00');

	// Slot detail modal
	let selectedSlot = $state<BookingSlot | null>(null);

	// Shift modal state
	let showShiftModal = $state(false);
	let shiftSlotTarget = $state<BookingSlot | null>(null);
	let shiftMinutes = $state(5);
	let shiftReason = $state('');
	let shiftCascade = $state(true);
	let shiftPreviewData = $state<ShiftPreview | null>(null);
	let shiftLoading = $state(false);
	let shiftError = $state('');

	async function loadDashboard() {
		loading = true;
		error = '';
		try {
			dashboardData = await bookingAdminAPI.getDashboard(selectedDate);

			// Try to get working hours from config
			try {
				const config = await bookingAdminAPI.getConfig();
				const wh = JSON.parse(config.working_hours);
				const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
				const dayHours = wh[String(dayOfWeek)];
				if (dayHours) {
					workingHoursStart = dayHours.open;
					workingHoursEnd = dayHours.close;
				}
			} catch {}
		} catch (e: any) {
			error = e.message || 'Failed to load dashboard';
		} finally {
			loading = false;
		}
	}

	function handleDateChange(e: Event) {
		const input = e.target as HTMLInputElement;
		selectedDate = input.value;
		loadDashboard();
	}

	// Chronometer helpers
	function timeToMinutes(time: string): number {
		const [h, m] = time.split(':').map(Number);
		return h * 60 + m;
	}

	function getCurrentSlot(): BookingSlot | null {
		if (!dashboardData?.slots) return null;
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		return dashboardData.slots.find(s => {
			const start = timeToMinutes(s.start_time);
			const end = timeToMinutes(s.end_time);
			return nowMinutes >= start && nowMinutes < end;
		}) || null;
	}

	function getNextSlot(): BookingSlot | null {
		if (!dashboardData?.slots) return null;
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		return dashboardData.slots.find(s => {
			const start = timeToMinutes(s.start_time);
			return start > nowMinutes;
		}) || null;
	}

	const currentSlot = $derived(getCurrentSlot());
	const nextSlot = $derived(getNextSlot());

	const chronoText = $derived(() => {
		const isToday = selectedDate === new Date().toISOString().split('T')[0];
		if (!isToday || !dashboardData?.slots?.length) return null;

		if (currentSlot) {
			const endMin = timeToMinutes(currentSlot.end_time);
			const nowMin = now.getHours() * 60 + now.getMinutes();
			const remaining = endMin - nowMin;
			const secs = 60 - now.getSeconds();
			const activeBookings = (currentSlot.bookings || []).filter(b => b.status !== 'cancelled');
			const slotIndex = dashboardData!.slots.indexOf(currentSlot) + 1;
			return {
				type: 'active' as const,
				text: `Идёт заезд ${slotIndex}, осталось ${remaining > 0 ? remaining - 1 : 0} мин ${secs < 60 ? secs : 0} сек`,
				count: activeBookings.length
			};
		}

		if (nextSlot) {
			const startMin = timeToMinutes(nextSlot.start_time);
			const nowMin = now.getHours() * 60 + now.getMinutes();
			const diff = startMin - nowMin;
			return {
				type: 'upcoming' as const,
				text: `Следующий заезд через ${diff} мин`,
				count: 0
			};
		}

		return {
			type: 'none' as const,
			text: 'Нет запланированных заездов',
			count: 0
		};
	});

	// Timeline position for current time marker (percentage)
	const timelinePosition = $derived(() => {
		const isToday = selectedDate === new Date().toISOString().split('T')[0];
		if (!isToday) return -1;
		const startMin = timeToMinutes(workingHoursStart);
		const endMin = timeToMinutes(workingHoursEnd);
		const nowMin = now.getHours() * 60 + now.getMinutes();
		if (nowMin < startMin || nowMin > endMin) return -1;
		return ((nowMin - startMin) / (endMin - startMin)) * 100;
	});

	function getSlotColor(slot: BookingSlot): string {
		if (slot.is_blocked) return '#6b7280';
		switch (slot.status) {
			case 'available': return '#374151';
			case 'limited': return '#d97706';
			case 'booked': return '#dc2626';
			case 'blocked': return '#6b7280';
			default: return '#374151';
		}
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			available: 'Свободен',
			limited: 'Осталось мало',
			booked: 'Занят',
			blocked: 'Заблокирован'
		};
		return labels[status] || status;
	}

	function getBookingStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'Ожидает',
			confirmed: 'Подтверждена',
			cancelled: 'Отменена',
			completed: 'Завершена',
			no_show: 'Не явился'
		};
		return labels[status] || status;
	}

	function getBookingStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: '#d97706',
			confirmed: '#059669',
			cancelled: '#dc2626',
			completed: '#6b7280',
			no_show: '#9333ea'
		};
		return colors[status] || '#6b7280';
	}

	function getSourceIcon(source: string): string {
		switch (source) {
			case 'twa': return '📱';
			case 'widget': return '🌐';
			case 'admin': return '📞';
			default: return '❓';
		}
	}

	function formatPrice(price: number): string {
		return price.toLocaleString('ru-RU') + ' ₽';
	}

	function openShiftModal(slot: BookingSlot) {
		shiftSlotTarget = slot;
		shiftMinutes = 5;
		shiftReason = '';
		shiftCascade = true;
		shiftPreviewData = null;
		shiftError = '';
		showShiftModal = true;
	}

	async function handlePreviewShift() {
		if (!shiftSlotTarget) return;
		shiftLoading = true;
		shiftError = '';
		try {
			shiftPreviewData = await bookingAdminAPI.previewShift(shiftSlotTarget.id, {
				shift_minutes: shiftMinutes,
				cascade: shiftCascade
			});
		} catch (e: any) {
			shiftError = e.message || 'Preview failed';
		} finally {
			shiftLoading = false;
		}
	}

	async function handleShift() {
		if (!shiftSlotTarget || !shiftReason.trim()) return;
		shiftLoading = true;
		shiftError = '';
		try {
			await bookingAdminAPI.shiftSlot(shiftSlotTarget.id, {
				shift_minutes: shiftMinutes,
				reason: shiftReason.trim(),
				cascade: shiftCascade
			});
			showShiftModal = false;
			selectedSlot = null;
			shiftSlotTarget = null;
			shiftPreviewData = null;
			await loadDashboard();
		} catch (e: any) {
			shiftError = e.message || 'Shift failed';
		} finally {
			shiftLoading = false;
		}
	}

	function closeShiftModal() {
		showShiftModal = false;
		shiftSlotTarget = null;
		shiftPreviewData = null;
		shiftError = '';
	}

	function getTimeAxisLabels(): Array<{ offset: number; text: string }> {
		const startMin = timeToMinutes(workingHoursStart);
		const endMin = timeToMinutes(workingHoursEnd);
		const totalMin = endMin - startMin;
		const labels: Array<{ offset: number; text: string }> = [];
		const hours = Math.ceil(totalMin / 60) + 1;
		for (let i = 0; i < hours; i++) {
			const hour = Math.floor(startMin / 60) + i;
			const offset = ((i * 60) / totalMin) * 100;
			if (offset <= 100) {
				labels.push({ offset, text: String(hour).padStart(2, '0') + ':00' });
			}
		}
		return labels;
	}

	function getSlotPosition(slot: BookingSlot): { left: number; width: number } {
		const startMin = timeToMinutes(workingHoursStart);
		const endMin = timeToMinutes(workingHoursEnd);
		const totalMin = endMin - startMin;
		const slotStart = timeToMinutes(slot.start_time);
		const slotEnd = timeToMinutes(slot.end_time);
		return {
			left: ((slotStart - startMin) / totalMin) * 100,
			width: ((slotEnd - slotStart) / totalMin) * 100
		};
	}

	onMount(() => {
		loadDashboard();
		chronoInterval = setInterval(() => {
			now = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (chronoInterval) clearInterval(chronoInterval);
	});
</script>

<svelte:head>
	<title>Бронирования - Admin</title>
</svelte:head>

<div class="bookings-dashboard">
	<div class="page-header">
		<div class="header-left">
			<h1>Бронирования</h1>
			<p class="text-muted">Dashboard и хронометраж</p>
		</div>
		<div class="header-right">
			<input
				type="date"
				value={selectedDate}
				onchange={handleDateChange}
				class="date-picker"
			/>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Загрузка...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<button class="btn-retry" onclick={loadDashboard}>Попробовать снова</button>
		</div>
	{:else if dashboardData}
		<!-- Chronometer -->
		{#if chronoText()}
			<div class="chronometer" class:active={chronoText()?.type === 'active'} class:upcoming={chronoText()?.type === 'upcoming'}>
				<div class="chrono-indicator">
					{#if chronoText()?.type === 'active'}
						<span class="pulse-dot"></span>
					{/if}
				</div>
				<span class="chrono-text">{chronoText()?.text}</span>
			</div>
		{/if}

		<!-- Stats Cards -->
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-value">{dashboardData.stats.totalBookings}</div>
				<div class="stat-label">Бронирований</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">{dashboardData.stats.totalParticipants}</div>
				<div class="stat-label">Участников</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">{formatPrice(dashboardData.stats.totalRevenue)}</div>
				<div class="stat-label">Выручка</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">{dashboardData.stats.occupancyPercent}%</div>
				<div class="stat-label">Загрузка</div>
			</div>
		</div>

		<!-- Timeline (Desktop) -->
		<div class="timeline-section desktop-only">
			<h2>Timeline</h2>
			<div class="timeline-container">
				<!-- Time axis labels -->
				<div class="time-axis">
					{#each getTimeAxisLabels() as label}
						<span class="time-label" style="left: {label.offset}%">{label.text}</span>
					{/each}
				</div>

				<!-- Slots track -->
				<div class="timeline-track">
					<!-- Current time marker -->
					{#if timelinePosition() >= 0}
						<div class="time-marker" style="left: {timelinePosition()}%"></div>
					{/if}

					{#each dashboardData.slots as slot (slot.id)}
						{@const slotPos = getSlotPosition(slot)}
						{@const isCurrent = currentSlot?.id === slot.id}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="timeline-slot"
							class:current={isCurrent}
							class:blocked={!!slot.is_blocked}
							style="left: {slotPos.left}%; width: {slotPos.width}%; background-color: {getSlotColor(slot)};"
							onclick={() => selectedSlot = slot}
							title="{slot.start_time} - {slot.end_time} | {getStatusLabel(slot.status)} | {slot.booked_participants}/{slot.max_participants}"
						>
							<span class="slot-time">{slot.start_time}</span>
							<span class="slot-count">{slot.booked_participants}/{slot.max_participants}</span>
							{#if slot.is_blocked}
								<span class="slot-lock">🔒</span>
							{/if}
							{#if slot.shift_minutes}
								<span class="slot-shift-badge" title="Смещён на {slot.shift_minutes} мин">⏩</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Slots List (Mobile) -->
		<div class="slots-list mobile-only">
			<h2>Слоты на {selectedDate}</h2>
			{#if dashboardData.slots.length === 0}
				<div class="empty-state">
					<p>Нет слотов на эту дату</p>
				</div>
			{:else}
				{#each dashboardData.slots as slot (slot.id)}
					{@const isCurrent = currentSlot?.id === slot.id}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="slot-card"
						class:current={isCurrent}
						class:blocked={!!slot.is_blocked}
						onclick={() => selectedSlot = slot}
					>
						<div class="slot-card-header">
							<span class="slot-card-time">{slot.start_time} - {slot.end_time}</span>
							<span class="slot-card-badge" style="background-color: {getSlotColor(slot)}; color: white;">
								{getStatusLabel(slot.status)}
							</span>
						</div>
						<div class="slot-card-body">
							<span>Мест: {slot.booked_participants}/{slot.max_participants}</span>
							{#if slot.is_blocked}
								<span>🔒 {slot.blocked_reason || 'Заблокирован'}</span>
							{/if}
							{#if slot.shift_minutes}
								<span class="shift-info">⏩ Смещён на {slot.shift_minutes} мин</span>
							{/if}
						</div>
						{#if slot.bookings && slot.bookings.length > 0}
							<div class="slot-card-bookings">
								{#each slot.bookings.filter(b => b.status !== 'cancelled') as b}
									<span class="mini-booking">
										{getSourceIcon(b.source)} {b.contact_name} ({b.participant_count})
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Shift Modal -->
		{#if showShiftModal && shiftSlotTarget}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={closeShiftModal}>
				<div class="modal shift-modal" onclick={(e) => e.stopPropagation()}>
					<header class="modal-header">
						<h2>Сместить слот {shiftSlotTarget.start_time}</h2>
						<button class="close-btn" onclick={closeShiftModal}>&times;</button>
					</header>
					<div class="modal-body">
						{#if shiftError}
							<div class="alert alert-error">{shiftError}</div>
						{/if}

						<div class="shift-form">
							<div class="form-group">
								<label>Смещение (минуты)</label>
								<div class="shift-minutes-row">
									<button class="btn-sm" onclick={() => shiftMinutes = Math.max(-60, shiftMinutes - 5)}>-5</button>
									<input type="number" bind:value={shiftMinutes} min="-60" max="60" class="form-input shift-input" />
									<button class="btn-sm" onclick={() => shiftMinutes = Math.min(60, shiftMinutes + 5)}>+5</button>
								</div>
								<p class="form-hint">Положительное = позже, отрицательное = раньше</p>
							</div>

							<div class="form-group">
								<label>Причина</label>
								<input type="text" bind:value={shiftReason} class="form-input" placeholder="Причина смещения..." />
							</div>

							<div class="form-group">
								<label class="toggle-label">
									<input type="checkbox" bind:checked={shiftCascade} />
									<span>Каскадное смещение (все последующие слоты)</span>
								</label>
							</div>

							<div class="shift-actions">
								<button class="btn-preview" onclick={handlePreviewShift} disabled={shiftLoading}>
									{shiftLoading ? 'Загрузка...' : 'Предпросмотр'}
								</button>
							</div>

							{#if shiftPreviewData}
								<div class="shift-preview">
									<h3>Предпросмотр</h3>
									<div class="preview-summary">
										<p>Затронуто слотов: <strong>{shiftPreviewData.total_affected}</strong></p>
										<p>Затронуто бронирований: <strong>{shiftPreviewData.bookings_affected}</strong></p>
									</div>
									<div class="preview-trigger">
										<span class="preview-slot-tag">
											{shiftPreviewData.trigger_slot.start_time} &rarr; {shiftPreviewData.trigger_slot.new_start_time}
										</span>
									</div>
									{#if shiftPreviewData.affected_slots.length > 0}
										<div class="preview-list">
											{#each shiftPreviewData.affected_slots as aSlot}
												<div class="preview-item" class:has-bookings={aSlot.has_bookings}>
													<span>{aSlot.start_time} &rarr; {aSlot.new_start_time}</span>
													{#if aSlot.has_bookings}
														<span class="preview-warn">({aSlot.booking_count} бронь)</span>
													{/if}
												</div>
											{/each}
										</div>
									{/if}

									<div class="shift-confirm-actions">
										<button class="btn-cancel" onclick={closeShiftModal}>Отмена</button>
										<button
											class="btn-primary"
											onclick={handleShift}
											disabled={shiftLoading || !shiftReason.trim()}
										>
											{shiftLoading ? 'Смещение...' : 'Подтвердить смещение'}
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Slot Detail Modal -->
		{#if selectedSlot}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={() => selectedSlot = null}>
				<div class="modal" onclick={(e) => e.stopPropagation()}>
					<header class="modal-header">
						<h2>Слот {selectedSlot.start_time} - {selectedSlot.end_time}</h2>
						<button class="close-btn" onclick={() => selectedSlot = null}>&times;</button>
					</header>
					<div class="modal-body">
						<div class="slot-detail-info">
							<p><strong>Статус:</strong> {getStatusLabel(selectedSlot.status)}</p>
							<p><strong>Мест:</strong> {selectedSlot.booked_participants}/{selectedSlot.max_participants}</p>
							{#if selectedSlot.is_blocked}
								<p><strong>Причина блокировки:</strong> {selectedSlot.blocked_reason || '—'}</p>
							{/if}
							{#if selectedSlot.shift_minutes}
								<p class="shift-info-detail">
									⏩ <strong>Смещён:</strong> {selectedSlot.shift_minutes > 0 ? '+' : ''}{selectedSlot.shift_minutes} мин
									{#if selectedSlot.original_start_time}
										(было {selectedSlot.original_start_time})
									{/if}
									{#if selectedSlot.shift_reason}
										— {selectedSlot.shift_reason}
									{/if}
								</p>
							{/if}
						</div>
						<div class="slot-actions">
							<button class="btn-shift" onclick={() => openShiftModal(selectedSlot!)}>
								⏩ Сместить
							</button>
						</div>

						{#if selectedSlot.bookings && selectedSlot.bookings.length > 0}
							<h3>Бронирования</h3>
							<div class="bookings-in-slot">
								{#each selectedSlot.bookings as booking}
									<div class="booking-card">
										<div class="booking-card-header">
											<span>{getSourceIcon(booking.source)} {booking.contact_name}</span>
											<span class="booking-status-badge" style="background-color: {getBookingStatusColor(booking.status)};">
												{getBookingStatusLabel(booking.status)}
											</span>
										</div>
										<div class="booking-card-body">
											<p>📞 {booking.contact_phone}</p>
											<p>👥 {booking.participant_count} чел. | ⏱️ {booking.duration} мин</p>
											<p>💰 {formatPrice(booking.total_price)}</p>
											{#if booking.notes}
												<p>📝 {booking.notes}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted">Нет бронирований в этом слоте</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.bookings-dashboard {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.text-muted {
		color: #6b7280;
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
	}

	.date-picker {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background: white;
		color: #111827;
	}

	/* Loading / Error */
	.loading-state, .error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.btn-retry {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	/* Chronometer */
	.chronometer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		margin-bottom: 1.5rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
	}

	.chronometer.active {
		background: #fef2f2;
		border-color: #fecaca;
	}

	.chronometer.upcoming {
		background: #fffbeb;
		border-color: #fde68a;
	}

	.chrono-indicator {
		display: flex;
		align-items: center;
	}

	.pulse-dot {
		width: 12px;
		height: 12px;
		background: #dc2626;
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.chrono-text {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #111827;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	/* Timeline Desktop */
	.timeline-section {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.timeline-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.timeline-container {
		position: relative;
	}

	.time-axis {
		position: relative;
		height: 24px;
		margin-bottom: 0.5rem;
	}

	.time-label {
		position: absolute;
		transform: translateX(-50%);
		font-size: 0.6875rem;
		color: #9ca3af;
		white-space: nowrap;
	}

	.timeline-track {
		position: relative;
		height: 80px;
		background: #f3f4f6;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.time-marker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #dc2626;
		z-index: 10;
		animation: markerPulse 2s ease-in-out infinite;
	}

	.time-marker::before {
		content: '';
		position: absolute;
		top: -4px;
		left: -4px;
		width: 10px;
		height: 10px;
		background: #dc2626;
		border-radius: 50%;
	}

	@keyframes markerPulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.timeline-slot {
		position: absolute;
		top: 4px;
		bottom: 4px;
		border-radius: 0.375rem;
		padding: 0.25rem 0.375rem;
		color: white;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		font-size: 0.6875rem;
		gap: 2px;
		min-width: 0;
	}

	.timeline-slot:hover {
		transform: scaleY(1.05);
		z-index: 5;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.timeline-slot.current {
		outline: 2px solid #dc2626;
		outline-offset: 2px;
		z-index: 4;
	}

	.timeline-slot.blocked {
		background-image: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 5px,
			rgba(255,255,255,0.15) 5px,
			rgba(255,255,255,0.15) 10px
		) !important;
	}

	.slot-time {
		font-weight: 600;
		white-space: nowrap;
	}

	.slot-count {
		opacity: 0.8;
		white-space: nowrap;
	}

	.slot-lock {
		font-size: 0.75rem;
	}

	/* Mobile Slots List */
	.slots-list h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.slot-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		cursor: pointer;
		transition: all 0.2s;
		min-height: 44px;
	}

	.slot-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.slot-card.current {
		border-left: 4px solid #dc2626;
	}

	.slot-card.blocked {
		opacity: 0.7;
	}

	.slot-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.slot-card-time {
		font-weight: 600;
		font-size: 1rem;
		color: #111827;
	}

	.slot-card-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.slot-card-body {
		display: flex;
		gap: 1rem;
		font-size: 0.8125rem;
		color: #6b7280;
		flex-wrap: wrap;
	}

	.slot-card-bookings {
		margin-top: 0.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.mini-booking {
		padding: 0.125rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		color: #374151;
	}

	/* Responsive visibility */
	.desktop-only {
		display: block;
	}

	.mobile-only {
		display: none;
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 0.75rem;
		width: 100%;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0.25rem;
		line-height: 1;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.slot-detail-info {
		margin-bottom: 1rem;
	}

	.slot-detail-info p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #374151;
	}

	.modal-body h3 {
		margin: 1rem 0 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}

	.bookings-in-slot {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.booking-card {
		background: #f9fafb;
		border-radius: 0.5rem;
		padding: 0.75rem;
		border: 1px solid #e5e7eb;
	}

	.booking-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #111827;
	}

	.booking-status-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 500;
		color: white;
	}

	.booking-card-body {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.booking-card-body p {
		margin: 0.125rem 0;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.page-header {
			flex-direction: column;
		}

		.stat-value {
			font-size: 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.stat-card {
			padding: 0.75rem;
		}

		.stat-value {
			font-size: 1.125rem;
		}

		.chrono-text {
			font-size: 0.8125rem;
		}
	}

	/* Shift Badge on Timeline */
	.slot-shift-badge {
		position: absolute;
		top: 2px;
		right: 2px;
		font-size: 0.5625rem;
		line-height: 1;
	}

	/* Shift Info in Slot Card */
	.shift-info {
		color: #7c3aed;
		font-weight: 500;
	}

	.shift-info-detail {
		color: #7c3aed;
		background: #f5f3ff;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		margin-top: 0.5rem !important;
		font-size: 0.8125rem !important;
	}

	/* Slot Actions in Detail Modal */
	.slot-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-shift {
		padding: 0.375rem 0.75rem;
		background: #7c3aed;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.btn-shift:hover {
		background: #6d28d9;
	}

	/* Shift Modal */
	.shift-modal {
		max-width: 500px;
	}

	.shift-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.shift-minutes-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.shift-input {
		width: 80px;
		text-align: center;
	}

	.btn-sm {
		padding: 0.375rem 0.5rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
	}

	.btn-sm:hover {
		background: #e5e7eb;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #111827;
	}

	.form-hint {
		margin: 0;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
	}

	.toggle-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		accent-color: #7c3aed;
	}

	.btn-preview {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.btn-preview:hover {
		background: #e5e7eb;
	}

	.btn-preview:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.shift-actions {
		display: flex;
		justify-content: flex-end;
	}

	/* Shift Preview */
	.shift-preview {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.shift-preview h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #111827;
	}

	.preview-summary {
		margin-bottom: 0.75rem;
	}

	.preview-summary p {
		margin: 0.125rem 0;
		font-size: 0.8125rem;
		color: #374151;
	}

	.preview-trigger {
		margin-bottom: 0.5rem;
	}

	.preview-slot-tag {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: #7c3aed;
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.preview-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 200px;
		overflow-y: auto;
		margin-bottom: 0.75rem;
	}

	.preview-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: #374151;
		border-radius: 0.25rem;
	}

	.preview-item.has-bookings {
		background: #fef2f2;
		border: 1px solid #fecaca;
	}

	.preview-warn {
		color: #dc2626;
		font-weight: 500;
		font-size: 0.75rem;
	}

	.shift-confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.btn-cancel {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
	}

	.btn-cancel:hover {
		background: #f3f4f6;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Alert */
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
</style>
