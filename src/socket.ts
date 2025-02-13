import {Socket, Server as SocketIOServer} from "socket.io";
import {Server as HttpServer} from "http";
import { logger } from "@shared/logger";
import Message from "@models/messageModel";
import { MessageStatus } from "@shared/enums";
import ConversationController from "@controllers/conversationController";
import MessageController from "@controllers/messageController";
import { Types } from "mongoose";

const onlineUsers = new Map<string, string>();

const initializeSocket = (server: HttpServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "DELETE"],
        },
    });
    io.on("connection", (socket: Socket) => {
        logger.info('⚡ User connected: ${socket.id}');

        socket.on("user-online", (userId: string) => {
            onlineUsers.set(userId, socket.id);
            logger.info("✅ User ${userId} is online");
        });

        socket.on("sent-message", async ({senderId, receiverId, text}) => {
            const message = await MessageController.createMessage(senderId, text);
            const conversation = await ConversationController.findOrCreateConversation(senderId, receiverId);
            conversation.messages.push(message._id as Types.ObjectId);
            const recieverSocketId = onlineUsers.get(receiverId);
            if(recieverSocketId) {
                io.to(recieverSocketId).emit("receive-message", {conversation, text});
                await Message.updateOne({_id: message._id}, {$set: {status: MessageStatus.DELIVERED}});
            }
            logger.info("📩 Message from ${senderId} to ${receiverId}: ${text}");
        });

        socket.on("get-conversation", async () => {

        });

        socket.on("get-all-conversations", async () => {

        });

        socket.on("disconnect", () => {
            onlineUsers.forEach((value: string, key: string) => {
                if(value == socket.id) {
                    onlineUsers.delete(key);
                    logger.info(`❌ User ${key} went offline`);
                }
            })
        });


    });

}