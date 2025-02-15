import { Types } from "mongoose";
import Message from "@models/messageModel";
import { MessageStatus } from "@shared/enums";

const createMessage = async (senderId: Types.ObjectId, text: string) => await Message.create({
  sender: senderId,
  text,
  status: MessageStatus.SENT
});

const getMessages = async (conversationId: Types.ObjectId): Promise<any> => await Message.find({ conversation: conversationId })
  .sort({ createdAt: 1 })
  .populate("sender", "userName avatar");

const MessageController = {
  createMessage,
  getMessages
};

export default MessageController;
