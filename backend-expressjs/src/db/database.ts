/**
 * Database module - миграция на Drizzle ORM
 *
 * Этот файл обеспечивает обратную совместимость со старым API,
 * но использует Drizzle ORM под капотом для типобезопасности
 * и возможности переключения на PostgreSQL
 */

import { db, dbInfo } from './client';
import * as schema from './schema';
import * as queries from './queries';
import './init'; // Автоматическая инициализация и seed

// Экспорт типов (обратная совместимость)
export type User = schema.User;
export type Post = schema.Post & {
	author_name?: string | null;
	author_email?: string | null;
};
export type Admin = schema.Admin;

// Экспорт Drizzle клиента
export { db };

// Экспорт информации о БД
export { dbInfo };

/**
 * Queries object - обеспечивает обратную совместимость
 * Внимание: Drizzle использует async/await, поэтому все методы возвращают Promise
 */
export const dbQueries = {
	// Users - теперь все методы async
	getAllUsers: queries.getAllUsers,
	getUserById: queries.getUserById,
	getUserByEmail: queries.getUserByEmail,
	createUser: queries.createUser,
	updateUser: queries.updateUser,
	deleteUser: queries.deleteUser,

	// Posts - теперь все методы async
	getAllPosts: queries.getAllPosts,
	getPostById: queries.getPostById,
	createPost: queries.createPost,
	updatePost: queries.updatePost,
	deletePost: queries.deletePost,

	// Admins - теперь все методы async
	getAdminByEmail: queries.getAdminByEmail,
	getAllAdmins: queries.getAllAdmins,
	createAdmin: queries.createAdmin,
	updateAdmin: queries.updateAdmin,
	updateAdminPassword: queries.updateAdminPassword,
	deleteAdmin: queries.deleteAdmin
};

/**
 * Функции инициализации (для обратной совместимости)
 * Теперь выполняются автоматически через ./init
 */
export function initializeDatabase() {
	console.log('✅ Database tables managed by Drizzle ORM');
}

// Экспорт схемы для прямого использования
export { schema };

// Экспорт queries для прямого использования
export { queries };

export default db;
