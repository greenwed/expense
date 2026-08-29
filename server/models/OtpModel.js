import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const otpStore = new JsonStore('otp_verifications');

export const OtpModel = {
  async generateOtp(email, type = 'register') {
    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const id = `otp_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const pool = getPgPool();

    if (pool) {
      // Remove any prior OTPs for this email and type
      await pool.query(
        'DELETE FROM otp_verifications WHERE LOWER(email) = LOWER($1) AND type = $2',
        [cleanEmail, type]
      );

      await pool.query(
        `INSERT INTO otp_verifications (id, email, otp, type, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, cleanEmail, otp, type, expiresAt]
      );
      return otp;
    }

    // JSON fallback
    otpStore.delete(o => o.email.toLowerCase() === cleanEmail && o.type === type);
    otpStore.insert({
      id,
      email: cleanEmail,
      otp,
      type,
      expiresAt: expiresAt.toISOString()
    });

    return otp;
  },

  async verifyOtp(email, otp, type = 'register') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `SELECT * FROM otp_verifications 
         WHERE LOWER(email) = LOWER($1) AND otp = $2 AND type = $3 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [cleanEmail, cleanOtp, type]
      );

      if (res.rows.length === 0) {
        return false;
      }

      // Consume OTP
      await pool.query(
        'DELETE FROM otp_verifications WHERE id = $1',
        [res.rows[0].id]
      );
      return true;
    }

    // JSON fallback
    const now = new Date();
    const match = otpStore.findOne(o => {
      return (
        o.email.toLowerCase() === cleanEmail &&
        String(o.otp) === cleanOtp &&
        o.type === type &&
        new Date(o.expiresAt) > now
      );
    });

    if (!match) {
      return false;
    }

    otpStore.delete(o => o.id === match.id || o._id === match.id);
    return true;
  }
};

export default OtpModel;
