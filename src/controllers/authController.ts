import bcrypt from "bcrypt";
import to from "await-to-ts";
import mongoose from "mongoose";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { generateToken } from "@utils/jwt";
import { Request, Response, NextFunction } from "express";
import Auth from "@models/authModel";
import User from "@models/userModel";
import sendEmail from "@utils/sendEmail";
import generateOTP from "@utils/generateOTP";

const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { userName, email, role, password, confirmPassword } = req.body;
  let error, auth, user, hashedPassword;

  [error, hashedPassword] = await to(bcrypt.hash(password, 10));
  if (error) return next(error);

  const verificationOTP = generateOTP();
  const verificationOTPExpiredAt = new Date(Date.now() + 30 * 60 * 1000);

  [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (auth) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ success: false, message: "Email already exists.", data: { isVerified: auth.isVerified } });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    [error, auth] = await to(
      Auth.create(
        [
          {
            email,
            role,
            password: hashedPassword,
            verificationOTP,
            verificationOTPExpiredAt,
            isVerified: false,
            isBlocked: false,
          },
        ],
        { session }
      )
    );
    if (error) throw error;

    auth = auth[0];

    [error, user] = await to(
      User.create(
        [
          {
            auth: auth._id,
            userName,
          },
        ],
        { session }
      )
    );
    if (error) throw error;

    await session.commitTransaction();

    await sendEmail(email, verificationOTP);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Registration successful",
      data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    await session.endSession();
  }
};

const activate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, verificationOTP } = req.body;
  let auth, user, error;

  if (!email || !verificationOTP) {
    return next(createError(StatusCodes.BAD_REQUEST, "Email and Verification OTP are required."));
  }

  [error, auth] = await to(Auth.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  const currentTime = new Date();
  if (currentTime > auth.verificationOTPExpiredAt!) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Verification OTP has expired."));
  }

  if (verificationOTP !== auth.verificationOTP) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please enter the correct code"));
  }

  auth.verificationOTP = "";
  auth.verificationOTPExpiredAt = null;
  auth.isVerified = true;

  [error] = await to(auth.save());
  if (error) return next(error);

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  if (!accessSecret) {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Unexpected server error."));
  }
  const accessToken = generateToken(auth._id!.toString(), accessSecret);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Account successfully verified.",
    data: { accessToken },
  });
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let error, auth, isPasswordValid;

  [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));

  [error, isPasswordValid] = await to(bcrypt.compare(password, auth.password));
  if (error) return next(error);

  if (!isPasswordValid) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password"));
  if (!auth.isVerified) return next(createError(StatusCodes.UNAUTHORIZED, "Verify your email first"));

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const accessToken = generateToken(auth._id!.toString(), accessSecret!);

  const user = await User.findOne({ auth: auth._id });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken },
  });
};

const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, status } = req.body;
  let error, auth;
  [error, auth] = await to(Auth.findOne({ email: email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "Account not found"));

  let verificationOTP, recoveryOTP;

  if (status === "activate" && auth.isVerified)
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Your account is already verified. Please login.", data: {} });

  if (status === "activate" && !auth.isVerified) {
    verificationOTP = generateOTP();
    auth.verificationOTP = verificationOTP;
    auth.verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    [error] = await to(auth.save());
    if (error) return next(error);
    sendEmail(email, verificationOTP);
  }

  if (status === "recovery") {
    recoveryOTP = generateOTP();
    auth.recoveryOTP = recoveryOTP;
    auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    [error] = await to(auth.save());
    if (error) return next(error);
    sendEmail(email, recoveryOTP);
  }

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "OTP resend successful", data: { verificationOTP, recoveryOTP } });
};

const recovery = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  const [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  const recoveryOTP = generateOTP();
  auth.recoveryOTP = recoveryOTP;
  auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
  await auth.save();

  await sendEmail(email, recoveryOTP);

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { recoveryOTP: auth.recoveryOTP } });
};

const recoveryVerification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;
  let error, auth;

  if (!email || !recoveryOTP) {
    return next(createError(StatusCodes.BAD_REQUEST, "Email and Recovery OTP are required."));
  }

  [error, auth] = await to(Auth.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  const currentTime = new Date();
  if (auth.recoveryOTPExpiredAt && currentTime > auth.recoveryOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  }

  if (recoveryOTP !== auth.recoveryOTP) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP."));
  }

  auth.recoveryOTP = "";
  auth.recoveryOTPExpiredAt = null;
  [error] = await to(auth.save());
  if (error) return next(error);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: {},
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password, confirmPassword } = req.body;

  const [error, auth] = await to(Auth.findOne({ email: email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));
  auth.password = await bcrypt.hash(password, 10);
  await auth.save();

  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;
  const { password, newPassword, confirmPassword } = req.body;
  let error, auth, isMatch;

  [error, auth] = await to(Auth.findById(user.authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  [error, isMatch] = await to(bcrypt.compare(password, auth.password));
  if (error) return next(error);
  if (!isMatch) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong Password"));

  auth.password = await bcrypt.hash(newPassword, 10);
  await auth.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const authId = req.user.authId;

  try {
    await Promise.all([Auth.findByIdAndDelete(authId), User.findByIdAndDelete(userId)]);
    return res.status(StatusCodes.OK).json({ success: true, message: "User Removed successfully", data: {} });
  } catch (e) {
    return next(e);
  }
};
const AuthController = {
  register,
  activate,
  login,
  resendOTP,
  recovery,
  recoveryVerification,
  resetPassword,
  changePassword,
  remove,
};

export default AuthController;
