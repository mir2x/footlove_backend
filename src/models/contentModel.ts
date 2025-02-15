import { Document, model, Schema } from "mongoose";
import { ContentType, FileType } from "@shared/enums";

type ContentSchema = Document & {
  contentType: ContentType;
  contentFileType: FileType;
  url: string;
  price: number;
};

const contentSchema = new Schema<ContentSchema>({
  contentType: {
    type: String,
    enum: Object.values(ContentType)
  },
  contentFileType: {
    type: String,
    enum: Object.values(FileType)
  },
  url: {
    type: String
  },
  price: {
    type: Number
  }
});

const Content = model<ContentSchema>("Content", contentSchema);
export default Content;