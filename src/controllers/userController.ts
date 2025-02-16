import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";
import { Expression, FilterQuery } from "mongoose";
import { Role } from "@shared/enums";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  let error, user;
  [error, user] = await to(User.findById(userId).populate({ path: "auth", select: "email" }).populate({path: "contents"}).lean());
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: user });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { search, role } = req.query;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    if (page < 1 || limit < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    let query: FilterQuery<typeof User> = {};

    if (role && Object.values(Role).includes(role as Role)) {
      query.role = role as Role;
    }

    if (search) {
      const regex = new RegExp(search as string, "i");
      query.$or = [
        { userName: regex },
        { country: regex }
      ];
    }

    const [error, users] = await to(User.find(query).select("userName avatar bio dateOfBirth footsize country gender interests")
      .skip(skip)
      .limit(limit)
      .lean());
    if(error) return next(error);

    const total = await User.countDocuments(query);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
};


const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const updates = req.body;

  if (updates.dateOfBirth && updates.dateOfBirth.day) {
    updates.dateOfBirth.day = Number(updates.dateOfBirth.day);
  }

  if (updates.dateOfBirth && updates.dateOfBirth.month) {
    updates.dateOfBirth.month = Number(updates.dateOfBirth.month);
  }
  
  if (updates.dateOfBirth && updates.dateOfBirth.year) {
    updates.dateOfBirth.year = Number(updates.dateOfBirth.year);
  }

  if (updates.footsize) {
    updates.footsize = Number.parseFloat(updates.footsize);
  }

  if (updates.interests) {
    updates.interests = JSON.parse(updates.interests);
  }

  const [error, user] = await to(User.findByIdAndUpdate(userId, { $set: updates }, { new: true }));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
};

const UserController = {
  get,
  getAll,
  update,
};

export default UserController;
