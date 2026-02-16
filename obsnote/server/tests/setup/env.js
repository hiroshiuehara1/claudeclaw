process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/obsnote_test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
process.env.REFRESH_TOKEN_TTL_DAYS = process.env.REFRESH_TOKEN_TTL_DAYS || "7";
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || "4";
process.env.SECURE_COOKIES = "false";
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost";
process.env.MAX_FAILED_LOGINS = "3";
process.env.ACCOUNT_LOCK_MINUTES = "1";

