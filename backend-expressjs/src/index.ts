import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database';
import { securityHeaders } from './middleware/security';

// Импорт роутеров
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import postsRouter from './routes/posts';
import cashierRouter from './routes/cashier';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (applied first)
app.use(securityHeaders);

// Middleware
app.use(cors({
	origin: 'http://localhost:5173', // SvelteKit dev server
	credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация базы данных
initializeDatabase();

// Базовый роут
app.get('/', (req, res) => {
	res.json({
		message: 'Project Box v3 - REST API (Loyalty System)',
		version: '3.0.0',
		endpoints: {
			auth: '/api/auth',
			users: '/api/users',
			posts: '/api/posts',
			cashier: '/api/cashier'
		}
	});
});

// API роуты
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/cashier', cashierRouter);

// Обработка 404
app.use((req, res) => {
	res.status(404).json({ error: 'Endpoint not found' });
});

// Запуск сервера
app.listen(PORT, () => {
	console.log(`\n✅ Server running on http://localhost:${PORT}`);
	console.log(`✅ API endpoints available at http://localhost:${PORT}/api\n`);
});
