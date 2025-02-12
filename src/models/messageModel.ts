import { Document, model, Schema, Types } from "mongoose";
import { MessageStatus } from "@shared/enums";

export type MessageSchema = Document & {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    text: string;
    status: MessageStatus;
}

const messageSchema = new Schema<MessageSchema>({
    sender : {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver : {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text : {
        type: String,
        required: true,
    },
    status: {
       type: String,
       enum: Object.values(MessageStatus),
       default: MessageStatus.SENT,
    },
});

const Message = model<MessageSchema>("Message", messageSchema);
export default Message;