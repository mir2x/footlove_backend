import { Socket, Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "@shared/logger";
import Message from "@models/messageModel";
import { MessageStatus } from "@shared/enums";
import ConversationController from "@controllers/conversationController";
import MessageController from "@controllers/messageController";
import { Types } from "mongoose";
import { DecodedUser } from "@models/userModel";
import { Decoded, decodeToken } from "@utils/jwt";
import * as process from "node:process";
import createError from "http-errors";
import StatusCodes from "http-status-codes";
import { getUserInfo } from "@middlewares/authorization";

const onlineUsers = new Map<string, string>();

const initializeSocket = (server: HttpServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "DELETE"],
        },
    });

    io.use(async (socket, next) => {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) {
            logger.warn("❌ No token provided, connection rejected");
            return next(new Error("Authentication error: No token provided"));
        }

        const [error, decoded] = decodeToken(token, process.env.JWT_ACCESS_SECRET!);
        if (error) return next(error);
        if (!decoded)
            return next(
              createError(StatusCodes.UNAUTHORIZED, "❌ Invalid token, connection rejected")
            );

        socket.user = await getUserInfo(decoded.id);
        next();
    });

    io.on("connection", (socket: Socket) => {
        logger.info(`⚡ User connected: ${socket.id}`);

        socket.on("user-online", () => {
            onlineUsers.set(socket.user.userId, socket.id);
            logger.info(`✅ User ${socket.user.userId} is online`);
        });

        socket.on("sent-message", async ({ senderId, receiverId, text }) => {
            try {
                const message = await MessageController.createMessage(senderId, text);
                const conversation = await ConversationController.findOrCreateConversation(senderId, receiverId);
                conversation.messages.push(message._id as Types.ObjectId);
                await conversation.save();

                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive-message", { conversation, text });
                    await Message.updateOne({ _id: message._id }, { $set: { status: MessageStatus.DELIVERED } });
                }

                logger.info(`📩 Message from ${senderId} to ${receiverId}: ${text}`);
            } catch (error) {
                logger.error("⚠️ Error sending message: ", error);
            }
        });

        socket.on("get-conversation", async ({ userId, otherUserId }) => {
            try {
                const conversation = await ConversationController.findConversation(userId, otherUserId);
                if (!conversation) {
                    return socket.emit("conversation-not-found", { message: "No conversation found" });
                }
                const messages = await MessageController.getMessages(conversation._id);
                socket.emit("conversation-data", { conversation, messages });
            } catch (error) {
                logger.error("⚠️ Error fetching conversation: ", error);
                socket.emit("error", { message: "Failed to fetch conversation" });
            }
        });

        socket.on("get-all-conversations", async ({ userId }) => {
            try {
                const conversations = await ConversationController.getUserConversations(userId);
                if (!conversations.length) {
                    return socket.emit("no-conversations", { message: "No conversations found" });
                }

                socket.emit("all-conversations", conversations);
            } catch (error) {
                logger.error("⚠️ Error fetching all conversations: ", error);
                socket.emit("error", { message: "Failed to fetch conversations" });
            }
        });

        socket.on("disconnect", () => {
            onlineUsers.forEach((value: string, key: string) => {
                if (value === socket.id) {
                    onlineUsers.delete(key);
                    logger.info(`❌ User ${key} went offline`);
                }
            });
        });
    });
};

export default initializeSocket;
