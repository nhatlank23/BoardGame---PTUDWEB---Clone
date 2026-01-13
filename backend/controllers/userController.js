const db = require('../configs/db');

module.exports = {
	// GET /api/users/search?q=...
	searchUsers: async (req, res) => {
		try {
			const q = req.query.q;
			if (!q || String(q).trim().length < 2) {
				return res.json({ data: [] });
			}

			const term = `%${String(q).trim()}%`;

			const rows = await db('users')
				.where('username', 'ilike', term)
				.orWhere('email', 'ilike', term)
				.select('id', 'username', 'email', 'avatar_url')
				.limit(10);

			const users = rows.map((r) => ({
				id: r.id,
				name: r.username,
				email: r.email,
				avatar: r.avatar_url || null,
			}));

			return res.json({ data: users });
		} catch (err) {
			console.error('searchUsers error:', err);
			return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
		}
	}
};
