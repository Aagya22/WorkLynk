process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/worklynk_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test_jwt_secret_key_for_worklynk_testing_only';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test_jwt_refresh_secret_key_for_worklynk_testing_only';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ?? 'test_encryption_key_for_worklynk_field_level_crypto';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5000';

// Keep any IP allow/block lists empty so ipFilter never rejects loopback tests.
process.env.IP_ALLOWLIST = '';
process.env.IP_BLOCKLIST = '';
