<!--
  PWA Install Button Component
  - Floating button для установки PWA
  - Автоматически показывается когда приложение можно установить
  - Скрывается после установки
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	let { variant = 'floating' } = $props<{
		variant?: 'floating' | 'inline';
	}>();

	// State
	let deferredPrompt: any = $state(null);
	let showButton = $state(false);
	let isInstalling = $state(false);
	let isIOS = $state(false);
	let showIOSInstructions = $state(false);

	onMount(() => {
		if (!browser) return;

		// Проверяем, уже установлено ли приложение
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
		console.log('[PWA Button] Standalone mode:', isStandalone);

		if (isStandalone) {
			console.log('[PWA Button] App already installed, hiding button');
			showButton = false;
			return;
		}

		// Определяем iOS
		const userAgent = window.navigator.userAgent.toLowerCase();
		isIOS = /iphone|ipad|ipod/.test(userAgent);
		console.log('[PWA Button] Is iOS:', isIOS);

		// Для iOS показываем кнопку сразу (у них нет beforeinstallprompt)
		if (isIOS) {
			console.log('[PWA Button] Showing button for iOS');
			showButton = true;
			return;
		}

		// Слушаем событие beforeinstallprompt
		const handleBeforeInstallPrompt = (e: Event) => {
			console.log('[PWA Button] beforeinstallprompt event fired');
			// Предотвращаем автоматическое появление браузерного промпта
			e.preventDefault();
			deferredPrompt = e;
			showButton = true;
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		// Слушаем событие установки
		window.addEventListener('appinstalled', () => {
			console.log('[PWA Button] App installed');
			deferredPrompt = null;
			showButton = false;
		});

		// Показываем кнопку через 3 секунды если событие не сработало (fallback)
		const fallbackTimer = setTimeout(() => {
			if (!deferredPrompt && !showButton && !isStandalone) {
				console.log('[PWA Button] Fallback: showing button after timeout');
				showButton = true;
			}
		}, 3000);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			clearTimeout(fallbackTimer);
		};
	});

	async function handleInstallClick() {
		// Для iOS показываем инструкцию
		if (isIOS) {
			showIOSInstructions = true;
			return;
		}

		// Для Android/Desktop - используем deferredPrompt
		if (!deferredPrompt) {
			console.log('[PWA Button] No deferred prompt available');
			console.log('[PWA Button] Possible reasons: user declined before, or browser settings');

			// Для Android без deferredPrompt показываем альтернативную инструкцию
			alert('Чтобы установить приложение:\n\n1. Откройте меню браузера (⋮)\n2. Выберите "Установить приложение" или "Добавить на главный экран"\n\nЕсли не видите такой опции, возможно приложение уже установлено или ваш браузер не поддерживает установку.');
			return;
		}

		isInstalling = true;

		try {
			console.log('[PWA Button] Showing install prompt');
			// Показываем native install prompt
			deferredPrompt.prompt();

			// Ждем выбора пользователя
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === 'accepted') {
				console.log('[PWA Button] Install accepted');
			} else {
				console.log('[PWA Button] Install declined');
			}

			// Очищаем промпт
			deferredPrompt = null;
			showButton = false;
		} catch (err) {
			console.error('[PWA Button] Install error:', err);
		} finally {
			isInstalling = false;
		}
	}
</script>

{#if showButton}
	{#if variant === 'floating'}
		<button class="pwa-install-floating" onclick={handleInstallClick} disabled={isInstalling}>
			<span class="icon">📱</span>
			<span class="text">{isInstalling ? 'Установка...' : 'Установить приложение'}</span>
		</button>
	{:else}
		<button class="pwa-install-inline" onclick={handleInstallClick} disabled={isInstalling}>
			<span class="icon">📱</span>
			<span class="text">{isInstalling ? 'Установка...' : 'Установить как приложение'}</span>
		</button>
	{/if}
{/if}

<!-- iOS Install Instructions Modal -->
{#if showIOSInstructions}
	<div class="modal-overlay" onclick={() => showIOSInstructions = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<span class="modal-icon">📱</span>
				<h3>Как установить приложение</h3>
			</div>

			<p class="modal-explanation">
				На iPhone/iPad приложения устанавливаются вручную через Safari.<br>
				<strong>Следуйте этим шагам:</strong>
			</p>

			<ol class="ios-instructions">
				<li>
					<span class="step-number">1</span>
					<div class="step-content">
						<div class="step-text">
							Нажмите кнопку <strong>"Поделиться"</strong>
							<span class="share-icon pulse">⎙</span>
							<span class="hint">внизу экрана Safari</span>
						</div>
					</div>
				</li>
				<li>
					<span class="step-number">2</span>
					<div class="step-content">
						<div class="step-text">
							Прокрутите вниз в меню и найдите<br>
							<strong>"На экран «Домой»"</strong> <span class="hint">(иконка с плюсом)</span>
						</div>
					</div>
				</li>
				<li>
					<span class="step-number">3</span>
					<div class="step-content">
						<div class="step-text">
							Нажмите <strong>"Добавить"</strong> в правом верхнем углу
						</div>
					</div>
				</li>
			</ol>

			<div class="modal-footer">
				<p class="footer-note">💡 После установки приложение появится на главном экране</p>
				<button class="close-btn" onclick={() => showIOSInstructions = false}>
					Понятно, установлю вручную
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pwa-install-floating {
		position: fixed;
		bottom: 24px;
		right: 24px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 50px;
		box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
		cursor: pointer;
		font-size: 15px;
		font-weight: 600;
		transition: all 0.3s ease;
		z-index: 1000;
		animation: slideInUp 0.4s ease;
	}

	.pwa-install-floating:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
	}

	.pwa-install-floating:active {
		transform: translateY(0);
	}

	.pwa-install-floating:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.pwa-install-inline {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		transition: all 0.2s ease;
		width: 100%;
	}

	.pwa-install-inline:hover {
		box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
	}

	.pwa-install-inline:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.icon {
		font-size: 20px;
		line-height: 1;
	}

	.text {
		line-height: 1;
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Адаптация для мобильных */
	@media (max-width: 640px) {
		.pwa-install-floating {
			bottom: 16px;
			right: 16px;
			padding: 12px 16px;
			font-size: 14px;
		}

		.icon {
			font-size: 18px;
		}
	}

	/* iOS Instructions Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 20px;
		animation: fadeIn 0.2s ease;
	}

	.modal-content {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		border-radius: 16px;
		padding: 24px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		animation: slideUp 0.3s ease;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.modal-icon {
		font-size: 32px;
	}

	.modal-content h3 {
		margin: 0;
		color: #f8fafc;
		font-size: 20px;
		font-weight: 700;
	}

	.modal-explanation {
		color: #cbd5e1;
		font-size: 14px;
		line-height: 1.6;
		margin: 0 0 20px 0;
		padding: 12px;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 8px;
		border-left: 3px solid #3b82f6;
	}

	.modal-explanation strong {
		color: #f8fafc;
	}

	.ios-instructions {
		list-style: none;
		padding: 0;
		margin: 0 0 20px 0;
	}

	.ios-instructions li {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.ios-instructions li:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		font-size: 14px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.step-content {
		flex: 1;
	}

	.step-text {
		color: #cbd5e1;
		font-size: 14px;
		line-height: 1.8;
	}

	.step-text strong {
		color: #f8fafc;
		font-weight: 600;
	}

	.hint {
		display: inline-block;
		color: #94a3b8;
		font-size: 12px;
		font-style: italic;
		margin-left: 4px;
	}

	.share-icon {
		display: inline-block;
		font-size: 20px;
		vertical-align: middle;
		margin: 0 6px;
		color: #3b82f6;
		font-weight: bold;
	}

	.share-icon.pulse {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
	}

	.modal-footer {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.footer-note {
		color: #94a3b8;
		font-size: 13px;
		text-align: center;
		margin: 0 0 16px 0;
	}

	.close-btn {
		width: 100%;
		padding: 12px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
	}

	.close-btn:active {
		transform: translateY(0);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
