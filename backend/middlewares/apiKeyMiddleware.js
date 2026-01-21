const validateApiKey = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: 'Truy cập bị từ chối: API Key không hợp lệ hoặc thiếu'
  });
};

module.exports = validateApiKey;