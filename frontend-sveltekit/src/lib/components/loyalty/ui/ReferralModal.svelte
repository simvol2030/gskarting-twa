<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { getFromStorage, saveToStorage } from '$lib/utils/storage';

	interface ReferralStats {
		invitedCount: number;
		earnedBonuses: number;
	}

	// Generate referral code based on user (in real app, from backend)
	const referralCode = 'PETSHOP' + Math.random().toString(36).substring(2, 8).toUpperCase();
	const referralLink = `https://myappbutik.ru/register?ref=${referralCode}`;

	let stats = $state<ReferralStats>(
		getFromStorage('loyalty_referral_stats', {
			invitedCount: 12,
			earnedBonuses: 1200
		})
	);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(referralCode);
			toastStore.show('Код скопирован!', 'success');
		} catch (err) {
			// Fallback for browsers without clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = referralCode;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				toastStore.show('Код скопирован!', 'success');
			} catch (e) {
				toastStore.show('Ошибка копирования', 'error');
			}
			document.body.removeChild(textArea);
		}
	}

	async function shareLink() {
		// Check if Web Share API is available
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Присоединяйтесь к программе лояльности!',
					text: `Используйте мой код ${referralCode} и получите 300 бонусов при регистрации!`,
					url: referralLink
				});
			} catch (err) {
				// User cancelled or error occurred
				if ((err as Error).name !== 'AbortError') {
					toastStore.show('Ошибка при попытке поделиться', 'error');
				}
			}
		} else {
			// Fallback: copy link to clipboard
			try {
				await navigator.clipboard.writeText(referralLink);
				toastStore.show('Ссылка скопирована!', 'success');
			} catch (err) {
				toastStore.show('Ошибка копирования ссылки', 'error');
			}
		}
	}
</script>

<div class="referral-modal">
	<div class="referral-content">
		<div class="referral-code-block">
			<h4>Ваш реферальный код</h4>
			<div class="referral-code">
				<span class="code-value">{referralCode}</span>
				<button class="copy-button" onclick={copyCode} aria-label="Скопировать код">
					<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
						/>
					</svg>
					<span>Скопировать</span>
				</button>
			</div>
		</div>

		<div class="referral-stats">
			<div class="stat-item">
				<div class="stat-value">{stats.invitedCount}</div>
				<div class="stat-label">Приглашено друзей</div>
			</div>
			<div class="stat-divider"></div>
			<div class="stat-item">
				<div class="stat-value">{stats.earnedBonuses} ₽</div>
				<div class="stat-label">Получено бонусов</div>
			</div>
		</div>

		<button class="button button-primary share-button" onclick={shareLink}>
			<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
				/>
			</svg>
			<span>Поделиться ссылкой</span>
		</button>

		<div class="referral-info">
			<h4>Как это работает?</h4>
			<ul>
				<li>
					<span class="step-number">1</span>
					<span class="step-text">Поделитесь кодом с другом</span>
				</li>
				<li>
					<span class="step-number">2</span>
					<span class="step-text">Друг получает 300 бонусов при регистрации</span>
				</li>
				<li>
					<span class="step-number">3</span>
					<span class="step-text">Вы получаете 500 бонусов после его первой покупки</span>
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.referral-modal {
		display: flex;
		flex-direction: column;
	}

	.referral-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.referral-code-block h4 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--text-base);
		color: var(--text-primary);
		font-weight: var(--font-semibold);
	}

	.referral-code {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		border: 2px dashed var(--border-color);
	}

	.code-value {
		flex: 1;
		font-size: 1.25rem;
		font-weight: var(--font-bold);
		font-family: 'Courier New', monospace;
		color: var(--accent);
		letter-spacing: 2px;
	}

	.copy-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--accent);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.copy-button:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 119, 0, 0.2);
	}

	.referral-stats {
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: var(--spacing-lg);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.stat-item {
		text-align: center;
		flex: 1;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: var(--font-bold);
		color: var(--accent);
		margin-bottom: var(--spacing-xs);
	}

	.stat-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.stat-divider {
		width: 1px;
		height: 60px;
		background: var(--border-color);
	}

	.share-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
	}

	.referral-info {
		padding: var(--spacing-lg);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.referral-info h4 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--text-base);
		color: var(--text-primary);
		font-weight: var(--font-semibold);
	}

	.referral-info ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.referral-info li {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
	}

	.step-number {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: white;
		border-radius: 50%;
		font-size: var(--text-sm);
		font-weight: var(--font-bold);
	}

	.step-text {
		flex: 1;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.6;
		padding-top: 4px;
	}

	.button {
		padding: var(--spacing-md) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.button-primary {
		background: var(--accent);
		color: white;
	}

	.button-primary:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 119, 0, 0.2);
	}

	.button-primary:active {
		transform: translateY(0);
	}

	@media (max-width: 480px) {
		.code-value {
			font-size: 1rem;
			letter-spacing: 1px;
		}

		.copy-button span {
			display: none;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.stat-label {
			font-size: 0.75rem;
		}
	}

	@media (min-width: 768px) {
		.referral-stats {
			padding: var(--spacing-xl);
		}
	}
</style>
