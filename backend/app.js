require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const app = express();
const auth = require("basic-auth");
const validateApiKey = require("./middlewares/apiKeyMiddleware"); // sử dụng sau
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
// api-docs - xem ở trang: http://localhost:3000/api-docs
const swaggerAuth = (req, res, next) => {
  const user = auth(req);
  if (user && user.name === "admin" && user.pass === "123456") {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="API Documentation"');
  return res.status(401).send("Vui lòng đăng nhập để xem Docs");
};

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Đồ án web - API Documentation",
      version: "1.0.0",
      description: "Tài liệu API đầy đủ cho hệ thống game online",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    tags: [
      { name: "Auth", description: "API xác thực và quản lý phiên đăng nhập" },
      { name: "Users", description: "API quản lý thông tin người dùng" },
      { name: "Users - Friends", description: "API quản lý bạn bè" },
      { name: "Users - Messages", description: "API tin nhắn" },
      {
        name: "Users - Stats",
        description: "API thống kê và lịch sử người dùng",
      },
      { name: "Games", description: "API quản lý game" },
      { name: "Game Sessions", description: "API quản lý phiên chơi game" },
      { name: "Admin", description: "API quản trị hệ thống" },
      { name: "Admin - Stats", description: "API thống kê cho admin" },
      { name: "Leaderboard", description: "API bảng xếp hạng" },
      { name: "Reviews", description: "API đánh giá và bình luận game" },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description:
            "Nhập mã: api_9f3c2b7a8d4e6a1f5c0e9b2d7a4c8e6f1b0d9a3e5c7f2a8b4d6c0e1",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Nhập JWT token nhận được từ endpoint /api/auth/login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["player", "admin"] },
            avatar_url: { type: "string", nullable: true },
            is_banned: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Game: {
          type: "object",
          properties: {
            id: { type: "integer" },
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            config: { type: "object" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        GameSession: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            game_id: { type: "integer" },
            state: { type: "object" },
            score: { type: "number" },
            duration: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Token không hợp lệ hoặc đã hết hạn",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Không có quyền truy cập",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs)
);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const gameRoutes = require("./routes/gameRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoute");
const reviewRoutes = require("./routes/reviewRoutes");

// Mount routes directly
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api", gameRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
