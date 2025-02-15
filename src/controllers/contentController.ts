import {Request, Response, NextFunction} from "express";
import to from "await-to-ts";
import Content from "@models/contentModel";
import User from "@models/userModel";
import { Types } from "mongoose";
import StatusCodes from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const {contentType, contentFileType, url, price} = req.body;
  const userId = req.user.userId;
  let error, content, user;
  [error, content] = await to(Content.create({contentType, contentFileType, url, price: Number.parseInt(price)}));
  if(error) return next(error);

  [error, user] = await to(User.findById(userId));
  if(error) return next(error);

  user!.contents.push(content._id as Types.ObjectId);
  [error] = await to(user!.save());
  if(error) return next(error);

  return res.status(StatusCodes.CREATED).json({success: true, message: "Success", content: content});
}

const ContentController = {
  create,
};
export default ContentController;