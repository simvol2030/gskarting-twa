<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingAdminAPI, type BookingSlot } from '$lib/api/admin/booking';

	let selectedDate = $state(new Date().toISOString().split('T')[0]);
	let slots = $state<BookingSlot[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Block modal
	let showBlockModal = $state(false);
	let blockingSlot = $state<BookingSlot | null>(null);
	let blockReason = $state('');
	let blockLoading = $state(false);

	// Schedule override modal
	let showOverrideModal = $state(false);
	let overrideForm = $state({
		is_closed: true,
		custom_open: '09:00',
		custom_close: '20:00',
		reason: ''
	});
	let overrideLoading = $state(false);

	async function loadSlots() {
		loading = true;
		error = '';
		try {
			const result = await bookingAdminAPI.getSlots(selectedDate);
			slots = result.slots;
		} catch (e: any) {
			error = e.message || 'Failed to load slots';
		} finally {
			loading = false;
		}
	}

	function handleDateChange() {
		loadSlots();
	}

	// Block slot
	function openBlockModal(slot: BookingSlot) {
		blockingSlot = slot;
		blockReason = '';
		showBlockModal = true;
	}

	async function submitBlock() {
		if (!blockingSlot) return;
		blockLoading = true;
		try {
			await bookingAdminAPI.blockSlot(blockingSlot.id, blockReason || undefined);
			showBlockModal = false;
			blockingSlot = null;
			loadSlots();
		} catch (e: any) {
			alert(e.message || 'Failed to block slot');
		} finally {
			blockLoading = false;
		}
	}

	// Unblock slot
	async function unblockSlot(slot: BookingSlot) {
		try {
			await bookingAdminAPI.unblockSlot(slot.id);
			loadSlots();
		} catch (e: any) {
			alert(e.message || 'Failed to unblock slot');
		}
	}

	// Schedule override
	function openOverrideModal() {
		overrideForm = { is_closed: true, custom_open: '09:00', custom_close: '20:00', reason: '' };
		showOverrideModal = true;
	}

	async function submitOverride() {
		overrideLoading = true;
		try {
			const data: any = {
				date: selectedDate,
				is_closed: overrideForm.is_closed,
				reason: overrideForm.reason || undefined
			};
			if (!overrideForm.is_closed) {
				data.custom_open = overrideForm.custom_open;
				data.custom_close = overrideForm.custom_close;
			}
			await bookingAdminAPI.createScheduleOverride(data);
			showOverrideModal = false;
			loadSlots();
		} catch (e: any) {
			alert(e.message || 'Failed to create override');
		} finally {
			overrideLoading = false;
		}
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = { available: 'Свободен', limited: 'Осталось мало', booked: 'Занят', blocked: 'Заблокирован' };
		return labels[status] || status;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = { available: '#059669', limited: '#d97706', booked: '#dc2626', blocked: '#6b7280' };
		return colors[status] || '#6b7280';
	}

	onMount(() => { loadSlots(); });
</script>

<svelte:head>
	<title>Управление слотами - Admin</title>
</svelte:head>

<div class="slots-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Управление слотами</h1>
			<p class="text-muted">Блокировка слотов и исключения</p>
		</div>
		<div class="header-actions">
			<input type="date" bind:value={selectedDate} onchange={handleDateChange} class="date-picker" />
			<button class="btn-secondary" onclick={openOverrideModal}>Исключение для дня</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
	{:else if error}
		<div class="error-state"><p>{error}</p><button class="btn-retry" onclick={loadSlots}>Повторить</button></div>
	{:else if slots.length === 0}
		<div class="empty-state"><p>Нет слотов на эту дату (день закрыт или за пределами горизонта)</p></div>
	{:else}
		<div class="slots-grid">
			{#each slots as slot (slot.id)}
				<div class="slot-card" class:blocked={!!slot.is_blocked}>
					<div class="slot-header">
						<span class="slot-time">{slot.start_time} - {slot.end_time}</span>
						<span class="slot-status" style="background-color: {getStatusColor(slot.status)}; color: white;">
							{getStatusLabel(slot.status)}
						</span>
					</div>
					<div class="slot-body">
						<div class="slot-occupancy">
							<div class="occupancy-bar">
								<div class="occupancy-fill" style="width: {(slot.booked_participants / slot.max_participants) * 100}%; background-color: {getStatusColor(slot.status)};"></div>
							</div>
							<span class="occupancy-text">{slot.booked_participants}/{slot.max_participants} мест</span>
						</div>
						{#if slot.is_blocked && slot.blocked_reason}
							<p class="block-reason">🔒 {slot.blocked_reason}</p>
						{/if}
						{#if slot.bookings && slot.bookings.length > 0}
							<div class="slot-bookings-preview">
								{#each slot.bookings.filter(b => b.status !== 'cancelled').slice(0, 3) as b}
									<span class="booking-mini">{b.contact_name} ({b.participant_count})</span>
								{/each}
								{#if slot.bookings.filter(b => b.status !== 'cancelled').length > 3}
									<span class="booking-mini more">+{slot.bookings.filter(b => b.status !== 'cancelled').length - 3}</span>
								{/if}
							</div>
						{/if}
					</div>
					<div class="slot-actions">
						{#if slot.is_blocked}
							<button class="btn-action btn-unblock" onclick={() => unblockSlot(slot)}>Разблокировать</button>
						{:else}
							<button class="btn-action btn-block" onclick={() => openBlockModal(slot)}>Заблокировать</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Block Modal -->
	{#if showBlockModal && blockingSlot}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={() => showBlockModal = false}>
			<div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
				<header class="modal-header">
					<h2>Заблокировать слот {blockingSlot.start_time}</h2>
					<button class="close-btn" onclick={() => showBlockModal = false}>&times;</button>
				</header>
				<div class="modal-body">
					<div class="form-group">
						<label>Причина блокировки</label>
						<textarea bind:value={blockReason} placeholder="Техническая неисправность..." class="form-input form-textarea" rows="3"></textarea>
					</div>
				</div>
				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => showBlockModal = false}>Отмена</button>
					<button class="btn-danger" onclick={submitBlock} disabled={blockLoading}>
						{blockLoading ? 'Блокировка...' : 'Заблокировать'}
					</button>
				</footer>
			</div>
		</div>
	{/if}

	<!-- Schedule Override Modal -->
	{#if showOverrideModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={() => showOverrideModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<header class="modal-header">
					<h2>Исключение для {selectedDate}</h2>
					<button class="close-btn" onclick={() => showOverrideModal = false}>&times;</button>
				</header>
				<div class="modal-body">
					<div class="form-group">
						<label class="toggle-label">
							<input type="checkbox" bind:checked={overrideForm.is_closed} />
							<span>Закрыть весь день</span>
						</label>
					</div>
					{#if !overrideForm.is_closed}
						<div class="form-row">
							<div class="form-group">
								<label>Открытие</label>
								<input type="time" bind:value={overrideForm.custom_open} class="form-input" />
							</div>
							<div class="form-group">
								<label>Закрытие</label>
								<input type="time" bind:value={overrideForm.custom_close} class="form-input" />
							</div>
						</div>
					{/if}
					<div class="form-group">
						<label>Причина</label>
						<input type="text" bind:value={overrideForm.reason} placeholder="Праздник, мероприятие..." class="form-input" />
					</div>
				</div>
				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => showOverrideModal = false}>Отмена</button>
					<button class="btn-primary" onclick={submitOverride} disabled={overrideLoading}>
						{overrideLoading ? 'Сохранение...' : 'Сохранить'}
					</button>
				</footer>
			</div>
		</div>
	{/if}
</div>

<style>
	.slots-page { max-width: 1200px; }

	.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
	.page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111827; }
	.text-muted { color: #6b7280; margin: 0.25rem 0 0 0; font-size: 0.875rem; }
	.header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

	.date-picker { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; background: white; color: #111827; }

	.btn-primary { padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-secondary { padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; }
	.btn-danger { padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; }
	.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

	/* Loading/Error/Empty */
	.loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
	.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn-retry { margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }

	/* Slots Grid */
	.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

	.slot-card { background: white; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); transition: all 0.2s; }
	.slot-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
	.slot-card.blocked { opacity: 0.7; background: #f9fafb; }

	.slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
	.slot-time { font-weight: 600; font-size: 1rem; color: #111827; }
	.slot-status { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 500; }

	.slot-body { margin-bottom: 0.75rem; }

	.occupancy-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 0.25rem; }
	.occupancy-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
	.occupancy-text { font-size: 0.8125rem; color: #6b7280; }

	.block-reason { margin: 0.5rem 0 0; font-size: 0.8125rem; color: #6b7280; font-style: italic; }

	.slot-bookings-preview { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; }
	.booking-mini { padding: 0.125rem 0.375rem; background: #f3f4f6; border-radius: 0.25rem; font-size: 0.6875rem; color: #374151; }
	.booking-mini.more { background: #e5e7eb; font-weight: 500; }

	.slot-actions { display: flex; gap: 0.5rem; }
	.btn-action { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem; cursor: pointer; font-weight: 500; min-height: 36px; }
	.btn-block { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
	.btn-block:hover { background: #fecaca; }
	.btn-unblock { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
	.btn-unblock:hover { background: #bbf7d0; }

	/* Modal */
	.modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
	.modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 500px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
	.modal-sm { max-width: 400px; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
	.modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #111827; }
	.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.25rem; line-height: 1; }
	.modal-body { padding: 1.5rem; }
	.modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; }

	/* Form */
	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.8125rem; font-weight: 500; color: #374151; }
	.form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; color: #111827; box-sizing: border-box; }
	.form-textarea { resize: vertical; font-family: inherit; }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

	.toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; color: #374151; }
	.toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #667eea; }

	@media (max-width: 768px) {
		.page-header { flex-direction: column; }
		.header-actions { width: 100%; }
		.slots-grid { grid-template-columns: 1fr; }
		.form-row { grid-template-columns: 1fr; }
	}
</style>
