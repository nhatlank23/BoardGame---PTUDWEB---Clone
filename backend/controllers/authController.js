const UserModel = require("../models/userModel");
const { generateToken } = require("../configs/auth");

class AuthController {
  // POST /api/auth/register
  static async register(req, res) {
    try {
      const { username, email, password, confirmPassword } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Username, email và password là bắt buộc",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: "error",
          message: "Mật khẩu xác nhận không khớp",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Email không hợp lệ",
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }

      // Check if username exists
      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          status: "error",
          message: "Username đã tồn tại",
        });
      }

      // Check if email exists
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          status: "error",
          message: "Email đã được sử dụng",
        });
      }

      // Create user
      const user = await UserModel.createUser({
        username,
        email,
        password,
        role: "player",
      });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        status: "success",
        message: "Đăng ký thành công",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            dark_mode: user.dark_mode,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi đăng ký",
        error: error.message,
      });
    }
  }

  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { emailOrUsername, password } = req.body;

      // Validate input
      if (!emailOrUsername || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email/Username và password là bắt buộc",
        });
      }

      // Find user by email or username
      let user = await UserModel.findByEmail(emailOrUsername);
      if (!user) {
        user = await UserModel.findByUsername(emailOrUsername);
      }

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Email/Username hoặc mật khẩu không đúng",
        });
      }

      // Check if user is banned
      if (user.is_banned) {
        return res.status(403).json({
          status: "error",
          message: "Tài khoản của bạn đã bị khóa",
        });
      }

      // Verify password
      const isPasswordValid = await UserModel.comparePassword(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "Email/Username hoặc mật khẩu không đúng",
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        status: "success",
        message: "Đăng nhập thành công",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            dark_mode: user.dark_mode,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi đăng nhập",
        error: error.message,
      });
    }
  }

  // GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
  static async getMe(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User không tồn tại",
        });
      }

      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // POST /api/auth/logout - Đăng xuất (client sẽ xóa token)
  static async logout(req, res) {
    try {
      // Với JWT stateless, logout chủ yếu xử lý ở client (xóa token)
      // Server chỉ trả response thành công
      // Có thể log hoạt động logout nếu cần
      
      res.status(200).json({
        status: "success",
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi đăng xuất",
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
