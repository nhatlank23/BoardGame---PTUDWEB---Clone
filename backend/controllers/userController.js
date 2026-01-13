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
  },

  // GET /api/friends
  getFriends: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440001';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const friendsAsRequester = await db('friendships')
        .where('friendships.requester_id', userId)
        .andWhere('friendships.status', 'accepted')
        .join('users', 'users.id', 'friendships.addressee_id')
        .select('users.id', 'users.username', 'users.email', 'users.avatar_url')
        .limit(100);

      const friendsAsAddressee = await db('friendships')
        .where('friendships.addressee_id', userId)
        .andWhere('friendships.status', 'accepted')
        .join('users', 'users.id', 'friendships.requester_id')
        .select('users.id', 'users.username', 'users.email', 'users.avatar_url')
        .limit(100);

      const allFriends = [...friendsAsRequester, ...friendsAsAddressee];
      
      const friends = allFriends.map((r) => ({
        id: r.id,
        name: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
      }));

      return res.json({ data: friends });
    } catch (err) {
      console.error('getFriends error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },
};
