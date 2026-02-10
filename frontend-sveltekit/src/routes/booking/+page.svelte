<script lang="ts">
	import BookingWidget from '$lib/components/booking/BookingWidget.svelte';
</script>

<svelte:head>
	<title>Бронирование заезда — GS Racing</title>
	<meta name="description" content="Забронируйте заезд в картинг-центре GS Racing. Выберите дату, время и количество участников." />
</svelte:head>

<div class="booking-page">
	<header class="booking-header">
		<h1 class="booking-logo">GS Racing</h1>
	</header>

	<BookingWidget mode="standalone" />

	<footer class="booking-footer">
		<p>GS Racing Karting Center</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.booking-page {
		min-height: 100vh;
		background: #0a0a0a;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		display: flex;
		flex-direction: column;
	}

	.booking-header {
		text-align: center;
		padding: 24px 16px 8px;
	}

	.booking-logo {
		font-family: 'Unbounded', sans-serif;
		font-size: 24px;
		font-weight: 800;
		color: #ff1744;
		margin: 0;
		letter-spacing: 1px;
	}

	.booking-footer {
		text-align: center;
		padding: 24px 16px;
		margin-top: auto;
	}

	.booking-footer p {
		font-size: 12px;
		color: #666;
		margin: 0;
	}
</style>
