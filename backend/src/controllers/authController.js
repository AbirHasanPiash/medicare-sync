import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

const prisma = new PrismaClient();

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      specialization,
      dateOfBirth,
      designation,
      shift,
    } = req.body;

    // Basic validation to ensure required fields aren't missing
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: 'User already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the User and their respective Profile in one transaction
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        doctorProfile:
          role === 'DOCTOR'
            ? { create: { specialization: specialization || 'General' } }
            : undefined,
        patientProfile:
          role === 'PATIENT'
            ? {
                create: {
                  dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
                },
              }
            : undefined,
        staffProfile:
          role === 'STAFF'
            ? {
                create: {
                  designation: designation || 'Staff',
                  shift: shift || 'Morning',
                },
              }
            : undefined,
      },
      include: {
        doctorProfile: true,
        patientProfile: true,
        staffProfile: true,
      },
    });

    // Strip the password out before sending the response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include all possible profile relations
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        patientProfile: true,
        staffProfile: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // 8 hour session
    );

    // Strip the password (this automatically keeps firstName and lastName!)
    const { password: _, ...userWithoutPassword } = user;

    // Send back token and sanitized user object
    res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        doctorProfile: true,
        patientProfile: true,
        staffProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (!user) {
      // For security, we don't explicitly say "User not found".
      // We just pretend it sent so attackers can't fish for valid emails.
      return res
        .status(200)
        .json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash it before saving to the database for security
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration to 1 hour from now
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email: user.email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires,
      },
    });

    // The URL the user will click
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Create a beautiful HTML Email Template
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0;">🩺 MediCare Sync</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello ${user.firstName},</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">We received a request to reset the password for your MediCare Sync account. Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">If you didn't make this request, you can safely ignore this email. Your password will remain unchanged. This secure link will expire in 1 hour.</p>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} MediCare Sync. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send the email with the new HTML content
    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Your MediCare Sync Password', // Customize your Subject here!
        html: htmlMessage, // Passes the HTML template
        message: `Please go to this link to reset your password: ${resetUrl}`, // Plain text fallback
      });

      res.status(200).json({ message: 'Reset link sent to email' });
    } catch (err) {
      // If email fails, wipe the token from the DB
      await prisma.user.update({
        where: { email: user.email },
        data: { resetPasswordToken: null, resetPasswordExpires: null },
      });
      return res.status(500).json({ error: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Hash the token from the URL to match what is in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }, // Token must not be expired
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }

    // Hash the new password
    const newHashedPassword = await bcrypt.hash(req.body.password, 10);

    // Update user and wipe the reset token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
