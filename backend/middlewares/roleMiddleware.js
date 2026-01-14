const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (allowedRoles.length === 0 || allowedRoles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({
        status: "error",
        message: "Forbidden - Insufficient permissions",
      });
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  };
};

module.exports = roleMiddleware;
