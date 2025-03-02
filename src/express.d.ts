import { DecodedUser, DecodedAdmin } from "@schemas/decodedUser";

declare global {
  namespace Express {
    interface Request {
      user: DecodedUser;
      files?: fileUpload.FileArray | null | undefined;
    }
  }
}
