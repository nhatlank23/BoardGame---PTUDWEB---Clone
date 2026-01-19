// In-memory OTP storage (for production, nên dùng Redis hoặc database)
const otpStore = new Map();

// Lưu OTP với thời gian hết hạn 5 phút
const saveOTP = (email, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
  });
};

// Kiểm tra OTP (không xóa - dùng cho verify step)
const checkOTP = (email, otp) => {
  const stored = otpStore.get(email);

  if (!stored) {
    return { valid: false, message: "OTP không tồn tại hoặc đã hết hạn" };
  }

  // Kiểm tra số lần thử
  if (stored.attempts >= 3) {
    otpStore.delete(email);
    return { valid: false, message: "Đã vượt quá số lần thử. Vui lòng yêu cầu OTP mới" };
  }

  // Kiểm tra hết hạn
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: "OTP đã hết hạn" };
  }

  // Kiểm tra mã OTP
  if (stored.otp !== otp) {
    stored.attempts += 1;
    return { valid: false, message: "OTP không đúng" };
  }

  // OTP hợp lệ - KHÔNG xóa, để dùng cho bước reset password
  return { valid: true, message: "OTP hợp lệ" };
};

// Xác thực và xóa OTP (dùng cho reset password step)
const verifyOTP = (email, otp) => {
  const result = checkOTP(email, otp);
  
  // Nếu OTP hợp lệ, xóa khỏi store
  if (result.valid) {
    otpStore.delete(email);
  }
  
  return result;
};

// Xóa OTP (dùng khi cần clean up)
const deleteOTP = (email) => {
  otpStore.delete(email);
};

// Clean up OTP hết hạn mỗi 10 phút
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 10 * 60 * 1000);

module.exports = {
  saveOTP,
  checkOTP,
  verifyOTP,
  deleteOTP,
};
