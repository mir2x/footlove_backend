import { Schema, model, Types, Document } from "mongoose";
import { ContentType, Gender, Months, Role } from "@shared/enums";

export type DecodedUser = {
  authId: string;
  userId: string;
  userName: string;
  email: string;
  role: Role;
  isVerified: boolean;
};

export type UserSchema = Document & {
  auth: Types.ObjectId;
  userName: string;
  avatar: string;
  cover: string;
  bio: string;
  dateOfBirth: {
    day: number;
    month: number;
    year: number;
  };
  footsize: number;
  country: string;
  gender: Gender;
  interests: string[];
  coin: number;
  contents: Types.ObjectId[];
  
};

const userSchema = new Schema<UserSchema>(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    cover: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      day: {
        type: Number,
      },
      month: {
        type: Number,
      },
      year: {
        type: Number,
      },
    },
    footsize: {
      type: Number,
    },
    country: {
      type: String,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    interests: {
      type: [String],
    },
    coin: {
      type: Number,
      default: 0,
    },
    contents: [{
      type: Schema.Types.ObjectId,
      ref: "Content",
    }],
  },
  {
    timestamps: true,
  }
);

export const User = model<UserSchema>("User", userSchema);
export default User;
