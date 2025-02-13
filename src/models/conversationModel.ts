import { Document, Schema, Types, model } from "mongoose";
import { MessageSchema } from "@models/messageModel";

export type ConversationSchema = Document & {
    participants: Types.ObjectId[];
    messages: Types.ObjectId[];
}

const conversationSchema = new Schema<ConversationSchema>({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        validate: [(val: Types.ObjectId[]) => val.length === 2, "Participants array must have 2 userIds"]
    }],
    messages: [{
        type: Schema.Types.ObjectId,
        ref: "Message",
        required: true
    }]
}, {
    timestamps: true
});

const Conversation = model<ConversationSchema>("Conversation", conversationSchema);
export default Conversation;
