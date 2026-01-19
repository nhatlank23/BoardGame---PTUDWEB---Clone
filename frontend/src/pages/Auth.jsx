import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: contextLogin, register: contextRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login fields
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  // Register OTP flow
  const [registerStep, setRegisterStep] = useState(1); // 1: form, 2: OTP
  const [registerOTP, setRegisterOTP] = useState("");

  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // Basic validation
      if (!emailOrUsername.trim()) {
        setError("Vui lòng nhập email hoặc username");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự");
        setIsLoading(false);
        return;
      }

      const result = await contextLogin(emailOrUsername, password);
      if (result.success) {
        const user = result.user;
        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/home");
        }
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send OTP to email for registration
  const handleSendRegisterOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // Validate username: tối thiểu 6 ký tự
      if (!username || username.trim().length < 6) {
        setError("Tên người dùng phải có ít nhất 6 ký tự");
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regEmail)) {
        setError("Email không hợp lệ");
        setIsLoading(false);
        return;
      }

      // Validate password match
      if (regPassword !== confirmPassword) {
        setError("Mật khẩu và xác nhận mật khẩu không khớp");
        setIsLoading(false);
        return;
      }

      // Validate password strength: 8+ chars, uppercase, lowercase, number, special char
      if (regPassword.length < 8) {
        setError("Mật khẩu phải có ít nhất 8 ký tự");
        setIsLoading(false);
        return;
      }
      if (!/[A-Z]/.test(regPassword)) {
        setError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa");
        setIsLoading(false);
        return;
      }
      if (!/[a-z]/.test(regPassword)) {
        setError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường");
        setIsLoading(false);
        return;
      }
      if (!/[0-9]/.test(regPassword)) {
        setError("Mật khẩu phải chứa ít nhất 1 chữ số");
        setIsLoading(false);
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(regPassword)) {
        setError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");
        setIsLoading(false);
        return;
      }

      // Send OTP to email
      await authService.sendRegisterOTP(regEmail, username);
      toast({
        title: "Thành công",
        description: "Mã OTP đã được gửi đến email của bạn",
      });
      setRegisterStep(2);
    } catch (err) {
      setError(err.message || "Không thể gửi OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and create account
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await contextRegister(username, regEmail, regPassword, confirmPassword, registerOTP);
      if (result.success) {
        toast({
          title: "Đăng ký thành công",
          description: "Chào mừng bạn đến với hệ thống!",
        });
        navigate("/home");
      } else {
        setError(result.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(forgotEmail);
      toast({
        title: "Thành công",
        description: "Mã OTP đã được gửi đến email của bạn",
      });
      setForgotStep(2);
    } catch (err) {
      setError(err.message || "Không thể gửi OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.verifyOTP(forgotEmail, otp);
      toast({
        title: "Thành công",
        description: "OTP hợp lệ. Vui lòng nhập mật khẩu mới",
      });
      setForgotStep(3);
    } catch (err) {
      setError(err.message || "OTP không hợp lệ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(forgotEmail, otp, newPassword);
      toast({
        title: "Thành công",
        description: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập",
      });
      resetForgotPassword();
      setActiveTab("login");
    } catch (err) {
      setError(err.message || "Không thể đặt lại mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">GameHub</span>
          </Link>
          <h1 className="text-3xl font-bold">{showForgotPassword ? "Quên mật khẩu" : "Chào mừng trở lại"}</h1>
          <p className="text-muted-foreground mt-2">{showForgotPassword ? "Đặt lại mật khẩu của bạn" : "Đăng nhập để tiếp tục chơi"}</p>
        </div>

        {showForgotPassword ? (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit mb-2" onClick={resetForgotPassword}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
              <CardTitle>
                {forgotStep === 1 && "Nhập email của bạn"}
                {forgotStep === 2 && "Nhập mã OTP"}
                {forgotStep === 3 && "Đặt mật khẩu mới"}
              </CardTitle>
              <CardDescription>
                {forgotStep === 1 && "Chúng tôi sẽ gửi mã OTP đến email của bạn"}
                {forgotStep === 2 && "Mã OTP đã được gửi đến email của bạn"}
                {forgotStep === 3 && "Nhập mật khẩu mới để hoàn tất"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  {error && <div className="text-destructive text-sm">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                  </Button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Mã OTP (6 chữ số)</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  {error && <div className="text-destructive text-sm">{error}</div>}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setForgotStep(1)} disabled={isLoading}>
                      Quay lại
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Đang xác thực..." : "Xác nhận OTP"}
                    </Button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <Input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  {error && <div className="text-destructive text-sm">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Đăng nhập</CardTitle>
                  <CardDescription>Nhập thông tin tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email/Username</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="Email hoặc username"
                        required
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu</Label>
                      <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <div className="text-destructive text-sm">{error}</div>}
                    <Button type="button" variant="link" className="px-0 text-sm" onClick={() => setShowForgotPassword(true)}>
                      Quên mật khẩu?
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Đăng ký</CardTitle>
                  <CardDescription>
                    {registerStep === 1 && "Tạo tài khoản mới để bắt đầu"}
                    {registerStep === 2 && "Nhập mã OTP đã được gửi đến email của bạn"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registerStep === 1 && (
                    <form onSubmit={handleSendRegisterOTP} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Tên người dùng</Label>
                        <Input id="username" type="text" placeholder="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="name@example.com"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Mật khẩu</Label>
                        <Input id="reg-password" type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                        <div className="text-xs space-y-1">
                          <div className="text-muted-foreground">Yêu cầu mật khẩu:</div>
                          <div className={regPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                            {regPassword.length >= 8 ? "✓" : "○"} Tối thiểu 8 ký tự
                          </div>
                          <div className={/[A-Z]/.test(regPassword) ? "text-green-600" : "text-muted-foreground"}>
                            {/[A-Z]/.test(regPassword) ? "✓" : "○"} Ít nhất 1 chữ in hoa (A-Z)
                          </div>
                          <div className={/[a-z]/.test(regPassword) ? "text-green-600" : "text-muted-foreground"}>
                            {/[a-z]/.test(regPassword) ? "✓" : "○"} Ít nhất 1 chữ thường (a-z)
                          </div>
                          <div className={/[0-9]/.test(regPassword) ? "text-green-600" : "text-muted-foreground"}>
                            {/[0-9]/.test(regPassword) ? "✓" : "○"} Ít nhất 1 chữ số (0-9)
                          </div>
                          <div className={/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? "text-green-600" : "text-muted-foreground"}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? "✓" : "○"} Ít nhất 1 ký tự đặc biệt (!@#$%...)
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                        <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      </div>
                      {error && <div className="text-destructive text-sm">{error}</div>}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Đang gửi OTP..." : "Tiếp tục"}
                      </Button>
                    </form>
                  )}

                  {registerStep === 2 && (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-otp">Mã OTP (6 chữ số)</Label>
                        <Input
                          id="register-otp"
                          type="text"
                          placeholder="123456"
                          required
                          maxLength={6}
                          value={registerOTP}
                          onChange={(e) => setRegisterOTP(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      {error && <div className="text-destructive text-sm">{error}</div>}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setRegisterStep(1)} disabled={isLoading}>
                          Quay lại
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                          {isLoading ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
