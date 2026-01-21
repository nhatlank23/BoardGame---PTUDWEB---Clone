const nodemailer = require("nodemailer");

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "chanelhynvuigames@gmail.com",
    pass: process.env.EMAIL_PASSWORD, // App password từ Google
  },
});

// Tạo mã OTP 6 chữ số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email OTP
const sendOTPEmail = async (email, otp, subject = "Mã OTP đặt lại mật khẩu - GameHub") => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "chanelhynvuigames@gmail.com",
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực tài khoản GameHub</h2>
        <p>Sử dụng mã OTP dưới đây để xác nhận:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="color: #666;">Mã OTP này có hiệu lực trong <strong>5 phút</strong>.</p>
        <p style="color: #666;">Nếu bạn không thực hiện thao tác này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Email này được gửi từ GameHub - Nền tảng giải trí trực tuyến</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Không thể gửi email OTP");
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};
