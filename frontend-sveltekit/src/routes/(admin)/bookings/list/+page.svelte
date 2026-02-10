<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingAdminAPI, type BookingItem, type BookingSlot } from '$lib/api/admin/booking';

	// Bookings state
	let bookingsList = $state<BookingItem[]>([]);
	let loading = $state(true);
	let error = $state('');
	let total = $state(0);
	let page = $state(1);
	let limit = $state(20);

	// Filters
	let filterDate = $state('');
	let filterStatus = $state('all');
	let filterType = $state('all');
	let searchQuery = $state('');

	// Create booking modal
	let showCreateModal = $state(false);
	let createDate = $state(new Date().toISOString().split('T')[0]);
	let createSlots = $state<BookingSlot[]>([]);
	let createLoading = $state(false);
	let createError = $state('');
	let createForm = $state({
		slot_id: 0,
		duration: 10,
		participant_type: 'adult' as 'adult' | 'child',
		participant_count: 1,
		contact_name: '',
		contact_phone: '',
		notes: ''
	});

	// Edit modal
	let showEditModal = $state(false);
	let editingBooking = $state<BookingItem | null>(null);
	let editForm = $state({ admin_notes: '', contact_name: '', contact_phone: '' });
	let editLoading = $state(false);

	// Cancel modal
	let showCancelModal = $state(false);
	let cancellingBooking = $state<BookingItem | null>(null);
	let cancelReason = $state('');
	let cancelLoading = $state(false);

	// Config for durations
	let durations = $state<number[]>([10, 15, 20]);

	async function loadBookings() {
		loading = true;
		error = '';
		try {
			const filters: any = { page, limit };
			if (filterDate) filters.date = filterDate;
			if (filterStatus !== 'all') filters.status = filterStatus;
			if (filterType !== 'all') filters.participant_type = filterType;
			if (searchQuery) filters.search = searchQuery;

			const result = await bookingAdminAPI.getBookings(filters);
			bookingsList = result.bookings;
			total = result.total;
		} catch (e: any) {
			error = e.message || 'Failed to load bookings';
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		page = 1;
		loadBookings();
	}

	function handlePageChange(newPage: number) {
		page = newPage;
		loadBookings();
	}

	// Confirm booking
	async function confirmBooking(booking: BookingItem) {
		try {
			await bookingAdminAPI.updateBooking(booking.id, { status: 'confirmed' });
			loadBookings();
		} catch (e: any) {
			alert(e.message || 'Failed to confirm');
		}
	}

	// Open cancel dialog
	function openCancelDialog(booking: BookingItem) {
		cancellingBooking = booking;
		cancelReason = '';
		showCancelModal = true;
	}

	async function submitCancel() {
		if (!cancellingBooking) return;
		cancelLoading = true;
		try {
			await bookingAdminAPI.updateBooking(cancellingBooking.id, {
				status: 'cancelled',
				cancel_reason: cancelReason || undefined
			});
			showCancelModal = false;
			cancellingBooking = null;
			loadBookings();
		} catch (e: any) {
			alert(e.message || 'Failed to cancel');
		} finally {
			cancelLoading = false;
		}
	}

	// Open edit dialog
	function openEditDialog(booking: BookingItem) {
		editingBooking = booking;
		editForm = {
			admin_notes: booking.admin_notes || '',
			contact_name: booking.contact_name,
			contact_phone: booking.contact_phone
		};
		showEditModal = true;
	}

	async function submitEdit() {
		if (!editingBooking) return;
		editLoading = true;
		try {
			await bookingAdminAPI.updateBooking(editingBooking.id, {
				admin_notes: editForm.admin_notes,
				contact_name: editForm.contact_name,
				contact_phone: editForm.contact_phone
			});
			showEditModal = false;
			editingBooking = null;
			loadBookings();
		} catch (e: any) {
			alert(e.message || 'Failed to update');
		} finally {
			editLoading = false;
		}
	}

	// Create booking
	async function openCreateModal() {
		showCreateModal = true;
		createError = '';
		createForm = { slot_id: 0, duration: durations[0] || 10, participant_type: 'adult', participant_count: 1, contact_name: '', contact_phone: '', notes: '' };
		await loadCreateSlots();
	}

	async function loadCreateSlots() {
		createLoading = true;
		try {
			const result = await bookingAdminAPI.getSlots(createDate);
			createSlots = result.slots.filter(s => !s.is_blocked && s.status !== 'blocked');
		} catch (e: any) {
			createError = e.message || 'Failed to load slots';
		} finally {
			createLoading = false;
		}
	}

	function handleCreateDateChange() {
		loadCreateSlots();
	}

	async function submitCreate() {
		createError = '';
		if (!createForm.slot_id || !createForm.contact_name || !createForm.contact_phone) {
			createError = 'Заполните все обязательные поля';
			return;
		}
		createLoading = true;
		try {
			await bookingAdminAPI.createBooking({
				slot_id: createForm.slot_id,
				duration: createForm.duration,
				participant_count: createForm.participant_count,
				contact_name: createForm.contact_name,
				contact_phone: createForm.contact_phone,
				notes: createForm.notes || undefined
			});
			showCreateModal = false;
			loadBookings();
		} catch (e: any) {
			createError = e.message || 'Failed to create booking';
		} finally {
			createLoading = false;
		}
	}

	// Helpers
	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = { pending: 'Ожидает', confirmed: 'Подтверждена', cancelled: 'Отменена', completed: 'Завершена', no_show: 'Не явился' };
		return labels[status] || status;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = { pending: '#d97706', confirmed: '#059669', cancelled: '#6b7280', completed: '#2563eb', no_show: '#dc2626' };
		return colors[status] || '#6b7280';
	}

	function getSourceIcon(source: string): string {
		switch (source) { case 'twa': return '📱'; case 'widget': return '🌐'; case 'admin': return '📞'; default: return '❓'; }
	}

	function formatPrice(price: number): string {
		return price.toLocaleString('ru-RU') + ' ₽';
	}

	const totalPages = $derived(Math.ceil(total / limit));

	onMount(async () => {
		try {
			const config = await bookingAdminAPI.getConfig();
			durations = JSON.parse(config.slot_durations);
		} catch {}
		loadBookings();
	});
</script>

<svelte:head>
	<title>Список бронирований - Admin</title>
</svelte:head>

<div class="bookings-list-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Список бронирований</h1>
			<p class="text-muted">Управление бронированиями</p>
		</div>
		<button class="btn-primary" onclick={openCreateModal}>+ Создать бронь</button>
	</div>

	<!-- Filters -->
	<div class="filters-bar">
		<input type="date" bind:value={filterDate} onchange={applyFilters} class="filter-input" />
		<select bind:value={filterStatus} onchange={applyFilters} class="filter-select">
			<option value="all">Все статусы</option>
			<option value="pending">Ожидает</option>
			<option value="confirmed">Подтверждена</option>
			<option value="cancelled">Отменена</option>
			<option value="completed">Завершена</option>
			<option value="no_show">Не явился</option>
		</select>
		<select bind:value={filterType} onchange={applyFilters} class="filter-select">
			<option value="all">Все типы</option>
			<option value="adult">Взрослые</option>
			<option value="child">Дети</option>
		</select>
		<input type="text" bind:value={searchQuery} placeholder="Поиск по имени/телефону" class="filter-input search-input" onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }} />
		<button class="btn-secondary" onclick={applyFilters}>Поиск</button>
	</div>

	{#if loading}
		<div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
	{:else if error}
		<div class="error-state"><p>{error}</p><button class="btn-retry" onclick={loadBookings}>Повторить</button></div>
	{:else if bookingsList.length === 0}
		<div class="empty-state"><p>Нет бронирований</p></div>
	{:else}
		<!-- Desktop Table -->
		<div class="table-wrapper desktop-only">
			<table class="bookings-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Время</th>
						<th>Клиент</th>
						<th>Тип</th>
						<th>Участники</th>
						<th>Сумма</th>
						<th>Статус</th>
						<th>Источник</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{#each bookingsList as booking (booking.id)}
						<tr>
							<td>#{booking.id}</td>
							<td>{booking.date} {booking.start_time}</td>
							<td>
								<div class="client-cell">
									<span class="client-name">{booking.contact_name}</span>
									<span class="client-phone">{booking.contact_phone}</span>
								</div>
							</td>
							<td><span class="type-badge" class:child={booking.participant_type === 'child'}>{booking.participant_type === 'adult' ? 'Взрослые' : 'Дети'}</span></td>
							<td>{booking.participant_count}</td>
							<td>{formatPrice(booking.total_price)}</td>
							<td><span class="status-badge" style="background-color: {getStatusColor(booking.status)};">{getStatusLabel(booking.status)}</span></td>
							<td><span title={booking.source}>{getSourceIcon(booking.source)}</span></td>
							<td class="actions-cell">
								{#if booking.status === 'pending'}
									<button class="btn-sm btn-confirm" onclick={() => confirmBooking(booking)}>✓</button>
								{/if}
								{#if booking.status === 'pending' || booking.status === 'confirmed'}
									<button class="btn-sm btn-cancel" onclick={() => openCancelDialog(booking)}>✕</button>
								{/if}
								<button class="btn-sm btn-edit" onclick={() => openEditDialog(booking)}>✎</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards mobile-only">
			{#each bookingsList as booking (booking.id)}
				<div class="booking-card">
					<div class="booking-card-top">
						<span class="booking-id">#{booking.id}</span>
						<span class="status-badge" style="background-color: {getStatusColor(booking.status)};">{getStatusLabel(booking.status)}</span>
					</div>
					<div class="booking-card-info">
						<p><strong>{booking.contact_name}</strong> {booking.contact_phone}</p>
						<p>{booking.date} {booking.start_time} | {booking.participant_count} чел. | {formatPrice(booking.total_price)}</p>
						<p>{getSourceIcon(booking.source)} {booking.participant_type === 'adult' ? 'Взрослые' : 'Дети'}</p>
					</div>
					<div class="booking-card-actions">
						{#if booking.status === 'pending'}
							<button class="btn-sm btn-confirm" onclick={() => confirmBooking(booking)}>Подтвердить</button>
						{/if}
						{#if booking.status === 'pending' || booking.status === 'confirmed'}
							<button class="btn-sm btn-cancel" onclick={() => openCancelDialog(booking)}>Отменить</button>
						{/if}
						<button class="btn-sm btn-edit" onclick={() => openEditDialog(booking)}>Редактировать</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				<button disabled={page === 1} onclick={() => handlePageChange(page - 1)}>&larr; Назад</button>
				<span class="page-info">Страница {page} из {totalPages} (всего: {total})</span>
				<button disabled={page === totalPages} onclick={() => handlePageChange(page + 1)}>Далее &rarr;</button>
			</div>
		{/if}
	{/if}

	<!-- Create Booking Modal -->
	{#if showCreateModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={() => showCreateModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<header class="modal-header">
					<h2>Создать бронирование</h2>
					<button class="close-btn" onclick={() => showCreateModal = false}>&times;</button>
				</header>
				<div class="modal-body">
					{#if createError}
						<div class="form-error">{createError}</div>
					{/if}
					<div class="form-group">
						<label>Дата</label>
						<input type="date" bind:value={createDate} onchange={handleCreateDateChange} class="form-input" />
					</div>
					<div class="form-group">
						<label>Слот</label>
						{#if createLoading}
							<p class="text-muted">Загрузка слотов...</p>
						{:else if createSlots.length === 0}
							<p class="text-muted">Нет доступных слотов</p>
						{:else}
							<select bind:value={createForm.slot_id} class="form-input">
								<option value={0}>Выберите слот</option>
								{#each createSlots as slot}
									<option value={slot.id}>{slot.start_time} - {slot.end_time} ({slot.max_participants - slot.booked_participants} мест)</option>
								{/each}
							</select>
						{/if}
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Длительность</label>
							<select bind:value={createForm.duration} class="form-input">
								{#each durations as d}
									<option value={d}>{d} мин</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label>Кол-во участников</label>
							<input type="number" bind:value={createForm.participant_count} min="1" max="8" class="form-input" />
						</div>
					</div>
					<div class="form-group">
						<label>Имя клиента *</label>
						<input type="text" bind:value={createForm.contact_name} placeholder="Иван Петров" class="form-input" />
					</div>
					<div class="form-group">
						<label>Телефон *</label>
						<input type="tel" bind:value={createForm.contact_phone} placeholder="+79161234567" class="form-input" />
					</div>
					<div class="form-group">
						<label>Заметки</label>
						<textarea bind:value={createForm.notes} placeholder="По телефону" class="form-input form-textarea" rows="2"></textarea>
					</div>
				</div>
				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => showCreateModal = false}>Отмена</button>
					<button class="btn-primary" onclick={submitCreate} disabled={createLoading}>
						{createLoading ? 'Создание...' : 'Создать'}
					</button>
				</footer>
			</div>
		</div>
	{/if}

	<!-- Cancel Booking Modal -->
	{#if showCancelModal && cancellingBooking}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={() => showCancelModal = false}>
			<div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
				<header class="modal-header">
					<h2>Отменить бронирование #{cancellingBooking.id}</h2>
					<button class="close-btn" onclick={() => showCancelModal = false}>&times;</button>
				</header>
				<div class="modal-body">
					<p>Вы уверены, что хотите отменить бронирование <strong>{cancellingBooking.contact_name}</strong>?</p>
					<div class="form-group">
						<label>Причина отмены</label>
						<textarea bind:value={cancelReason} placeholder="Укажите причину..." class="form-input form-textarea" rows="3"></textarea>
					</div>
				</div>
				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => showCancelModal = false}>Назад</button>
					<button class="btn-danger" onclick={submitCancel} disabled={cancelLoading}>
						{cancelLoading ? 'Отмена...' : 'Отменить бронь'}
					</button>
				</footer>
			</div>
		</div>
	{/if}

	<!-- Edit Booking Modal -->
	{#if showEditModal && editingBooking}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={() => showEditModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<header class="modal-header">
					<h2>Редактировать #{editingBooking.id}</h2>
					<button class="close-btn" onclick={() => showEditModal = false}>&times;</button>
				</header>
				<div class="modal-body">
					<div class="form-group">
						<label>Имя клиента</label>
						<input type="text" bind:value={editForm.contact_name} class="form-input" />
					</div>
					<div class="form-group">
						<label>Телефон</label>
						<input type="tel" bind:value={editForm.contact_phone} class="form-input" />
					</div>
					<div class="form-group">
						<label>Заметки админа</label>
						<textarea bind:value={editForm.admin_notes} class="form-input form-textarea" rows="3"></textarea>
					</div>
				</div>
				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => showEditModal = false}>Отмена</button>
					<button class="btn-primary" onclick={submitEdit} disabled={editLoading}>
						{editLoading ? 'Сохранение...' : 'Сохранить'}
					</button>
				</footer>
			</div>
		</div>
	{/if}
</div>

<style>
	.bookings-list-page { max-width: 1200px; }

	.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
	.page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111827; }
	.text-muted { color: #6b7280; margin: 0.25rem 0 0 0; font-size: 0.875rem; }

	.btn-primary { padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; white-space: nowrap; }
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-secondary { padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; }
	.btn-danger { padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; }
	.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

	/* Filters */
	.filters-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
	.filter-input, .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; background: white; color: #111827; }
	.search-input { flex: 1; min-width: 200px; }

	/* Loading/Error/Empty */
	.loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
	.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn-retry { margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }

	/* Table */
	.table-wrapper { overflow-x: auto; background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
	.bookings-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
	.bookings-table th { padding: 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 0.8125rem; white-space: nowrap; }
	.bookings-table td { padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #111827; }
	.bookings-table tr:hover { background: #f9fafb; }

	.client-cell { display: flex; flex-direction: column; }
	.client-name { font-weight: 500; }
	.client-phone { font-size: 0.75rem; color: #6b7280; }

	.type-badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: #dbeafe; color: #1e40af; }
	.type-badge.child { background: #fce7f3; color: #9d174d; }

	.status-badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 500; color: white; white-space: nowrap; }

	.actions-cell { display: flex; gap: 0.25rem; }
	.btn-sm { padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; cursor: pointer; border: 1px solid; min-width: 28px; min-height: 28px; display: inline-flex; align-items: center; justify-content: center; }
	.btn-confirm { background: #dcfce7; color: #166534; border-color: #86efac; }
	.btn-confirm:hover { background: #bbf7d0; }
	.btn-cancel { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
	.btn-cancel:hover { background: #fecaca; }
	.btn-edit { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
	.btn-edit:hover { background: #bfdbfe; }

	/* Mobile Cards */
	.booking-card { background: white; border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
	.booking-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
	.booking-id { font-weight: 600; color: #6b7280; font-size: 0.8125rem; }
	.booking-card-info { font-size: 0.8125rem; color: #374151; margin-bottom: 0.75rem; }
	.booking-card-info p { margin: 0.125rem 0; }
	.booking-card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

	/* Pagination */
	.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; padding: 1rem; }
	.pagination button { padding: 0.5rem 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; color: #374151; }
	.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
	.page-info { font-size: 0.875rem; color: #6b7280; }

	/* Modal */
	.modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
	.modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
	.modal-sm { max-width: 440px; }
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
	.form-error { padding: 0.5rem 0.75rem; background: #fee2e2; color: #991b1b; border-radius: 0.375rem; margin-bottom: 1rem; font-size: 0.875rem; }

	/* Responsive */
	.desktop-only { display: block; }
	.mobile-only { display: none; }

	@media (max-width: 768px) {
		.desktop-only { display: none; }
		.mobile-only { display: block; }
		.filters-bar { flex-direction: column; }
		.search-input { min-width: 0; }
		.form-row { grid-template-columns: 1fr; }
		.page-header { flex-direction: column; }
	}
</style>
