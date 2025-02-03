import { Schema, model, Types, Document } from "mongoose";
import { Gender, Months } from "@shared/enums";

export type DecodedUser = {
  authId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
};

export type UserSchema = Document & {
  auth: Types.ObjectId;
  userName: string;
  avatar: string;
  bio: string;
  dateOfBirth: {
    day: number;
    month: Months;
    year: number;
  };
  footsize: number;
  country: string;
  gender: Gender;
  interests: string[];
};

const userSchema = new Schema(
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
      avatar : {
        type: String,
        trim: true,
      },
      bio: {
        type: String,
        trim: true,
      },
      dateOfBirth : {
        day: {
          type: Number,
        },
        month: {
          type: String,
          enum: Object.values(Months),
        },
        year: {
          type: Number,
        }
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
    },
  {
    timestamps: true,
  }
);

export const User = model<UserSchema>("User", userSchema);
export default User;
