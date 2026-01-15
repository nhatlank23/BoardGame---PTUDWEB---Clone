const UserModel = require("../models/userModel");
const { generateToken } = require("../configs/auth");
const { generateOTP, sendOTPEmail } = require("../configs/email");
const { saveOTP, checkOTP, verifyOTP } = require("../configs/otpStore");

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

  // POST /api/auth/forgot-password - Gửi OTP qua email
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email là bắt buộc",
        });
      }

      // Kiểm tra email có tồn tại không
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "Email không tồn tại trong hệ thống",
        });
      }

      // Tạo và lưu OTP
      const otp = generateOTP();
      saveOTP(email, otp);

      // Gửi email
      await sendOTPEmail(email, otp);

      res.status(200).json({
        status: "success",
        message: "Mã OTP đã được gửi đến email của bạn",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể gửi mã OTP. Vui lòng thử lại sau",
        error: error.message,
      });
    }
  }

  // POST /api/auth/verify-otp - Xác thực OTP (không xóa OTP)
  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          status: "error",
          message: "Email và OTP là bắt buộc",
        });
      }

      // Dùng checkOTP thay vì verifyOTP để không xóa OTP
      const result = checkOTP(email, otp);

      if (!result.valid) {
        return res.status(400).json({
          status: "error",
          message: result.message,
        });
      }

      res.status(200).json({
        status: "success",
        message: "OTP hợp lệ",
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi xác thực OTP",
        error: error.message,
      });
    }
  }

  // POST /api/auth/reset-password - Đặt lại mật khẩu sau khi xác thực OTP
  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          status: "error",
          message: "Email, OTP và mật khẩu mới là bắt buộc",
        });
      }

      // Validate password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }

      // Xác thực OTP
      const result = verifyOTP(email, otp);
      if (!result.valid) {
        return res.status(400).json({
          status: "error",
          message: result.message,
        });
      }

      // Cập nhật mật khẩu
      await UserModel.updatePassword(email, newPassword);

      res.status(200).json({
        status: "success",
        message: "Đặt lại mật khẩu thành công",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể đặt lại mật khẩu",
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
