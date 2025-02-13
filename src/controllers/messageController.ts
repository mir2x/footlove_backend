import { Types } from "mongoose";
import Message from "@models/messageModel";
import { MessageStatus } from "@shared/enums";

const createMessage = async (senderId: Types.ObjectId, text: string) => await Message.create({ sender: senderId, text, status: MessageStatus.SENT });

const MessageController = {
    createMessage,
};

export default MessageController;