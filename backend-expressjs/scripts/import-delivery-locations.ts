/**
 * Import Delivery Locations from YAML
 *
 * This script reads delivery-price.yml and imports all locations
 * into the delivery_locations table.
 *
 * Usage: tsx scripts/import-delivery-locations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Database from 'better-sqlite3';

// Path to YAML file
const YAML_PATH = '/mnt/c/dev/granat/Районы доставки/delivery-price.yml';

// Path to database (same as in db/client.ts)
const DB_PATH = path.join(__dirname, '../../data/db/sqlite/app.db');

interface YAMLLocation {
	destination: string;
	price_from_zelenogradskaya: number;
}

async function importLocations() {
	console.log('📦 Starting delivery locations import...\n');

	// Read and parse YAML
	console.log(`📄 Reading YAML file: ${YAML_PATH}`);
	let yamlContent = fs.readFileSync(YAML_PATH, 'utf8');

	// Remove markdown code blocks if present (```yaml and ```)
	yamlContent = yamlContent.replace(/^```yaml\s*\n/m, '').replace(/\n```\s*$/m, '');

	const locations = yaml.load(yamlContent) as YAMLLocation[];

	console.log(`✅ Found ${locations.length} locations in YAML\n`);

	// Connect to database
	console.log(`🗄️  Connecting to database: ${DB_PATH}`);
	const db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');

	// Create table if not exists (idempotent)
	console.log('🔨 Ensuring delivery_locations table exists...');
	db.exec(`
		CREATE TABLE IF NOT EXISTS delivery_locations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			price INTEGER NOT NULL,
			is_enabled INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);

	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_delivery_locations_name ON delivery_locations(name);
		CREATE INDEX IF NOT EXISTS idx_delivery_locations_enabled ON delivery_locations(is_enabled);
		CREATE INDEX IF NOT EXISTS idx_delivery_locations_enabled_name ON delivery_locations(is_enabled, name);
	`);

	console.log('✅ Table and indexes ready\n');

	// Clear existing data
	console.log('🗑️  Clearing existing delivery locations...');
	const deleteStmt = db.prepare('DELETE FROM delivery_locations');
	deleteStmt.run();
	console.log('✅ Existing data cleared\n');

	// Prepare insert statement
	const insertStmt = db.prepare(`
		INSERT INTO delivery_locations (name, price, is_enabled)
		VALUES (?, ?, 1)
	`);

	// Import locations in transaction
	console.log('📥 Importing locations...');
	const insertMany = db.transaction((locs: YAMLLocation[]) => {
		for (const loc of locs) {
			// Convert rubles to kopeks (700 руб = 70000 копеек)
			const priceInKopeks = loc.price_from_zelenogradskaya * 100;

			insertStmt.run(loc.destination, priceInKopeks);
		}
	});

	insertMany(locations);

	// Verify import
	const countStmt = db.prepare('SELECT COUNT(*) as count FROM delivery_locations');
	const result = countStmt.get() as { count: number };

	console.log(`✅ Import completed successfully!`);
	console.log(`📊 Total locations imported: ${result.count}\n`);

	// Show sample data
	console.log('📋 Sample data (first 5 locations):');
	const sampleStmt = db.prepare(`
		SELECT id, name, price, is_enabled
		FROM delivery_locations
		ORDER BY name
		LIMIT 5
	`);
	const samples = sampleStmt.all();

	console.table(samples);

	// Close database
	db.close();
	console.log('\n✅ Database connection closed');
	console.log('🎉 Import process finished successfully!');
}

// Run import
importLocations().catch((error) => {
	console.error('❌ Import failed:', error);
	process.exit(1);
});
