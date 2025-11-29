<script lang="ts">
	import type { PageData } from './$types';
	import ClientDetailHeader from '$lib/components/admin/clients/ClientDetailHeader.svelte';
	import ClientStatsGrid from '$lib/components/admin/clients/ClientStatsGrid.svelte';
	import ClientBalanceCard from '$lib/components/admin/clients/ClientBalanceCard.svelte';
	import ClientTransactionsTable from '$lib/components/admin/clients/ClientTransactionsTable.svelte';
	import ManualBalanceModal from '$lib/components/admin/clients/ManualBalanceModal.svelte';

	let { data }: { data: PageData } = $props();

	// Modal state
	let isBalanceModalOpen = $state(false);

	// Current balance (для optimistic update)
	let currentBalance = $state(data.stats.currentBalance);
	let effectiveBalance = $state(data.stats.effectiveBalance);

	// User permissions (TODO: получать из session)
	const canAdjustBalance = true; // editor или super-admin
	const canBlock = false; // только super-admin

	const openBalanceModal = () => {
		isBalanceModalOpen = true;
	};

	const closeBalanceModal = () => {
		isBalanceModalOpen = false;
	};

	const handleBalanceSuccess = (newBalance: number) => {
		// Optimistic update
		currentBalance = newBalance;
		effectiveBalance = newBalance - data.stats.expiredPoints;

		// TODO: Show toast notification
		console.log('Баланс успешно изменен:', newBalance);
	};

	const handleToggleBlock = async () => {
		// TODO: implement
		console.log('Toggle block client');
	};

	// Update stats with optimistic balance
	const updatedStats = $derived(() => ({
		...data.stats,
		currentBalance,
		effectiveBalance
	}));
</script>

<svelte:head>
	<title>{data.client.name} - Клиент - Loyalty Admin</title>
</svelte:head>

<div class="client-detail-page">
	<ClientDetailHeader
		client={data.client}
		onToggleBlock={handleToggleBlock}
		canBlock={canBlock}
	/>

	<ClientStatsGrid stats={updatedStats()} />

	<div class="content-grid">
		<ClientBalanceCard
			stats={updatedStats()}
			onAdjustBalance={openBalanceModal}
			canAdjust={canAdjustBalance}
		/>
	</div>

	<ClientTransactionsTable transactions={data.transactions} />

	<!-- Modals -->
	<ManualBalanceModal
		isOpen={isBalanceModalOpen}
		clientId={data.client.id}
		currentBalance={currentBalance}
		onClose={closeBalanceModal}
		onSuccess={handleBalanceSuccess}
	/>
</div>

<style>
	.client-detail-page {
		max-width: 1400px;
		padding: 0;
	}

	.content-grid {
		margin-bottom: 2rem;
	}
</style>
