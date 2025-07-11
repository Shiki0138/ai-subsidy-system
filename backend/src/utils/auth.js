const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ai-subsidy-secret-key-2024';

// トークン生成
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24時間
    },
    JWT_SECRET
  );
}

// トークン検証
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };