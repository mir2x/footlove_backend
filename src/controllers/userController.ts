import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const email = req.user.email;
  let error, user;
  [error, user] = await to(User.findById(userId));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: user });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.params.id;
  const updates = req.body;

  const [error, user] = await to(User.findByIdAndUpdate(userId, { $set: updates }, { new: true }));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
};

const UserController = {
  get,
  update
};

export default UserController;
