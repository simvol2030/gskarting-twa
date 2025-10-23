<script lang="ts">
	import { modalStore } from '$lib/stores/modal.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { getFromStorage, saveToStorage } from '$lib/utils/storage';

	interface Pet {
		id: string;
		type: 'cat' | 'dog' | 'bird' | 'other';
		name: string;
		breed?: string;
		age?: number;
	}

	let pets = $state<Pet[]>(getFromStorage('loyalty_pets', []));
	let showAddForm = $state(false);
	let editingPet = $state<Pet | null>(null);

	// Form fields
	let petType = $state<'cat' | 'dog' | 'bird' | 'other'>('cat');
	let petName = $state('');
	let petBreed = $state('');
	let petAge = $state<number | undefined>(undefined);

	function getIcon(type: Pet['type']): string {
		const icons: Record<Pet['type'], string> = {
			cat: '🐱',
			dog: '🐶',
			bird: '🐦',
			other: '🐾'
		};
		return icons[type];
	}

	function showForm() {
		resetForm();
		showAddForm = true;
	}

	function hideForm() {
		showAddForm = false;
		editingPet = null;
		resetForm();
	}

	function resetForm() {
		petType = 'cat';
		petName = '';
		petBreed = '';
		petAge = undefined;
	}

	function savePet() {
		if (!petName.trim()) {
			toastStore.show('Введите кличку питомца', 'error');
			return;
		}

		if (editingPet) {
			// Update existing pet
			const petToEdit = editingPet; // Create non-null reference
			const index = pets.findIndex((p) => p.id === petToEdit.id);
			if (index !== -1) {
				pets[index] = {
					...petToEdit,
					type: petType,
					name: petName.trim(),
					breed: petBreed.trim() || undefined,
					age: petAge || undefined
				};
				toastStore.show('Питомец обновлён!', 'success');
			}
		} else {
			// Add new pet
			const newPet: Pet = {
				id: `pet-${Date.now()}`,
				type: petType,
				name: petName.trim(),
				breed: petBreed.trim() || undefined,
				age: petAge || undefined
			};
			pets = [...pets, newPet];
			toastStore.show('Питомец добавлен!', 'success');
		}

		saveToStorage('loyalty_pets', pets);
		hideForm();
	}

	function editPet(pet: Pet) {
		editingPet = pet;
		petType = pet.type;
		petName = pet.name;
		petBreed = pet.breed || '';
		petAge = pet.age;
		showAddForm = true;
	}

	function deletePet(id: string) {
		pets = pets.filter((p) => p.id !== id);
		saveToStorage('loyalty_pets', pets);
		toastStore.show('Питомец удалён', 'success');
	}
</script>

<div class="pets-modal">
	{#if pets.length > 0}
		<div class="pets-list">
			{#each pets as pet (pet.id)}
				<div class="pet-card">
					<div class="pet-icon">{getIcon(pet.type)}</div>
					<div class="pet-info">
						<h4>{pet.name}</h4>
						<p class="pet-breed">{pet.breed || 'Порода не указана'}</p>
						{#if pet.age}
							<p class="pet-age">{pet.age} {pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}</p>
						{/if}
					</div>
					<div class="pet-actions">
						<button
							class="icon-button"
							aria-label="Редактировать питомца"
							onclick={() => editPet(pet)}
						>
							✏️
						</button>
						<button
							class="icon-button"
							aria-label="Удалить питомца"
							onclick={() => deletePet(pet.id)}
						>
							🗑️
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p>Вы ещё не добавили питомцев</p>
		</div>
	{/if}

	{#if !showAddForm}
		<button class="button button-primary add-pet-button" onclick={showForm}>
			🐾 Добавить питомца
		</button>
	{/if}

	{#if showAddForm}
		<div class="add-pet-form">
			<h4>{editingPet ? 'Редактировать питомца' : 'Добавить питомца'}</h4>

			<label for="pet-type">Тип</label>
			<select id="pet-type" bind:value={petType}>
				<option value="cat">🐱 Кошка</option>
				<option value="dog">🐶 Собака</option>
				<option value="bird">🐦 Птица</option>
				<option value="other">🐾 Другое</option>
			</select>

			<label for="pet-name">Кличка *</label>
			<input
				id="pet-name"
				type="text"
				bind:value={petName}
				placeholder="Введите кличку"
				maxlength="30"
			/>

			<label for="pet-breed">Порода</label>
			<input
				id="pet-breed"
				type="text"
				bind:value={petBreed}
				placeholder="Необязательно"
				maxlength="50"
			/>

			<label for="pet-age">Возраст (лет)</label>
			<input id="pet-age" type="number" bind:value={petAge} placeholder="Необязательно" min="0" max="50" />

			<div class="form-actions">
				<button class="button button-primary" onclick={savePet}>
					{editingPet ? 'Сохранить' : 'Добавить'}
				</button>
				<button class="button button-secondary" onclick={hideForm}>Отмена</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.pets-modal {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.pets-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		max-height: 400px;
		overflow-y: auto;
		padding: var(--spacing-xs);
	}

	.pet-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.pet-card:hover {
		background: var(--bg-hover);
	}

	.pet-icon {
		font-size: 2rem;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		border-radius: var(--radius-md);
	}

	.pet-info {
		flex: 1;
	}

	.pet-info h4 {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: var(--text-base);
		color: var(--text-primary);
	}

	.pet-info p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.pet-breed {
		margin-bottom: 4px;
	}

	.pet-actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	.icon-button {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.icon-button:hover {
		background: var(--bg-primary);
		transform: scale(1.1);
	}

	.empty-state {
		text-align: center;
		padding: var(--spacing-xl) var(--spacing-md);
		color: var(--text-secondary);
	}

	.add-pet-button {
		width: 100%;
		margin-top: var(--spacing-sm);
	}

	.add-pet-form {
		background: var(--bg-secondary);
		padding: var(--spacing-lg);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.add-pet-form h4 {
		margin: 0;
		color: var(--text-primary);
	}

	.add-pet-form label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: calc(var(--spacing-xs) * -1);
	}

	.add-pet-form select,
	.add-pet-form input {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-size: var(--text-base);
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: all var(--transition-fast);
	}

	.add-pet-form select:focus,
	.add-pet-form input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(255, 119, 0, 0.1);
	}

	.form-actions {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.form-actions .button {
		flex: 1;
	}

	.button {
		padding: var(--spacing-sm) var(--spacing-lg);
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

	.button-secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.button-secondary:hover {
		background: var(--bg-hover);
	}

	@media (min-width: 768px) {
		.pets-list {
			max-height: 500px;
		}
	}
</style>
