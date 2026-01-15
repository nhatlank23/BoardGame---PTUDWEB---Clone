const db = require("../configs/db");
const bcrypt = require("bcrypt");

class UserModel {
  // Tạo user mới
  static async createUser({ username, email, password, role = "player" }) {
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db("users")
      .insert({
        username,
        email,
        password_hash: passwordHash,
        role,
        dark_mode: true,
        is_banned: false,
      })
      .returning(["id", "username", "email", "role", "avatar_url", "dark_mode", "is_banned", "created_at"]);

    return user;
  }

  // Tìm user theo email
  static async findByEmail(email) {
    const user = await db("users").where({ email }).first();
    return user;
  }

  // Tìm user theo username
  static async findByUsername(username) {
    const user = await db("users").where({ username }).first();
    return user;
  }

  // Tìm user theo ID
  static async findById(id) {
    const user = await db("users").where({ id }).select("id", "username", "email", "role", "avatar_url", "dark_mode", "is_banned", "created_at").first();
    return user;
  }

  // So sánh password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Lấy tất cả users (cho admin)
  static async getAllUsers() {
    return await db("users").select("id", "username", "email", "role", "avatar_url", "dark_mode", "is_banned", "created_at").orderBy("created_at", "desc");
  }

  // Update user
  static async updateUser(id, data) {
    const [user] = await db("users")
      .where({ id })
      .update(data)
      .returning(["id", "username", "email", "role", "avatar_url", "dark_mode", "is_banned", "updated_at"]);
    return user;
  }

  // Ban/Unban user
  static async toggleBan(id, isBanned) {
    return await this.updateUser(id, { is_banned: isBanned });
  }
}

module.exports = UserModel;
