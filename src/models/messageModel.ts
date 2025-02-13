import { Document, model, Schema, Types } from "mongoose";
import { MessageStatus } from "@shared/enums";

export type MessageSchema = Document & {
    sender: Types.ObjectId;
    text: string;
    file: string;
    status: MessageStatus;
    timestamp: Date;
}

const messageSchema = new Schema<MessageSchema>({
    sender : {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text : {
        type: String,
        required: true,
    },
    file: {
        type: String,
        default: "",
    },
    status: {
       type: String,
       enum: Object.values(MessageStatus),
       default: MessageStatus.SENT,
    },
    timestamp: {
        type: Date,
        default: Date.now(),
    }
});

const Message = model<MessageSchema>("Message", messageSchema);
export default Message;