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

  // GET /api/friends/requests
  getFriendRequests: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440003';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const rows = await db('friendships')
        .where('friendships.addressee_id', userId)
        .andWhere('friendships.status', 'pending')
        .join('users', 'users.id', 'friendships.requester_id')
        .select('users.id', 'users.username', 'users.email', 'users.avatar_url')
        .limit(50);

      const requests = rows.map((r) => ({
        id: r.id,
        name: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
      }));

      return res.json({ data: requests });
    } catch (err) {
      console.error('getFriendRequests error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },

  // POST /api/friends/request
  sendFriendRequest: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440001';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const { addresseeId } = req.body;
      if (!addresseeId) {
        return res.status(400).json({ status: 'error', message: 'addresseeId is required' });
      }

      if (userId === addresseeId) {
        return res.status(400).json({ status: 'error', message: 'Cannot send friend request to yourself' });
      }

      const existing = await db('friendships')
        .where(function() {
          this.where({ requester_id: userId, addressee_id: addresseeId })
            .orWhere({ requester_id: addresseeId, addressee_id: userId });
        })
        .first();

      if (existing) {
        if (existing.status === 'accepted') {
          return res.status(400).json({ status: 'error', message: 'Already friends' });
        }
        if (existing.status === 'pending') {
          return res.status(400).json({ status: 'error', message: 'Friend request already exists' });
        }
      }

      const [newRequest] = await db('friendships')
        .insert({
          requester_id: userId,
          addressee_id: addresseeId,
          status: 'pending'
        })
        .returning('*');

      return res.json({ success: true, data: newRequest });
    } catch (err) {
      console.error('sendFriendRequest error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },

  // DELETE /api/friends/:id
  deleteFriend: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440001';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const friendId = req.params.id;
      if (!friendId) {
        return res.status(400).json({ status: 'error', message: 'Friend id is required' });
      }

      const deleted = await db('friendships')
        .where(function() {
          this.where({ requester_id: userId, addressee_id: friendId })
            .orWhere({ requester_id: friendId, addressee_id: userId });
        })
        .del();

      if (deleted === 0) {
        return res.status(404).json({ status: 'error', message: 'Friendship not found' });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('deleteFriend error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },

  // PATCH /api/friends/respond
  respondToFriendRequest: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440001';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const { requesterId, action } = req.body;
      if (!requesterId || !action) {
        return res.status(400).json({ status: 'error', message: 'requesterId and action are required' });
      }

      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ status: 'error', message: 'action must be accept or decline' });
      }

      const friendship = await db('friendships')
        .where({
          requester_id: requesterId,
          addressee_id: userId,
          status: 'pending'
        })
        .first();

      if (!friendship) {
        return res.status(404).json({ status: 'error', message: 'Friend request not found' });
      }

      if (action === 'accept') {
        await db('friendships')
          .where({ id: friendship.id })
          .update({ status: 'accepted' });
      } else {
        await db('friendships')
          .where({ id: friendship.id })
          .update({ status: 'declined' });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('respondToFriendRequest error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },

  // GET /api/messages/:receiver_id
  getMessages: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || '550e8400-e29b-41d4-a716-446655440001';
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const receiverId = req.params.receiver_id;
      if (!receiverId) {
        return res.status(400).json({ status: 'error', message: 'receiver_id is required' });
      }

      const messages = await db('messages')
        .where(function() {
          this.where({ sender_id: userId, receiver_id: receiverId })
            .orWhere({ sender_id: receiverId, receiver_id: userId });
        })
        .select('id', 'sender_id', 'receiver_id', 'content', 'created_at')
        .orderBy('created_at', 'asc')
        .limit(200);

      return res.json({ data: messages });
    } catch (err) {
      console.error('getMessages error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },
};
