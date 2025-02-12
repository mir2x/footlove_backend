import {Socket, Server as SocketIOServer} from "socket.io";
import {Server as HttpServer} from "http";
import { logger } from "@shared/logger";
import Message from "@models/messageModel";
import { MessageStatus } from "@shared/enums";

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

        socket.on("disconnect", () => {
            onlineUsers.forEach((value: string, key: string) => {
                if(value == socket.id) {
                    onlineUsers.delete(key);
                    logger.info(`❌ User ${key} went offline`);
                }
            })
        });

        socket.on("sent-message", async (data) => {
            const {senderId, receiverId, text} = data;
            const message = await Message.create({sender: senderId, receiver: receiverId, text});
            logger.info("📩 Message from ${senderId} to ${receiverId}: ${text}");

            const recieverSocketId = onlineUsers.get(receiverId);

            if(recieverSocketId) {
                io.to(recieverSocketId).emit("receive-message", message);
                await Message.updateOne({_id: message._id}, {$set: {status: MessageStatus.DELIVERED}});
            }
        })

    });

}




//export const initializeSocket = (server: HttpServer) => {
//    const io = new SocketIOServer(server, {
//        cors: {
//            origin: "*", // Adjust based on frontend domain
//            methods: ["GET", "POST"],
//        },
//    });
//
//    io.on("connection", (socket: Socket) => {
//        console.log(`⚡ User connected: ${socket.id}`);
//
//        // ✅ Handle user online status
//        socket.on("user-online", (userId: string) => {
//            onlineUsers.set(userId, socket.id);
//            console.log(`✅ User ${userId} is online`);
//        });
//
//        // ✅ Handle user disconnect
//        socket.on("disconnect", () => {
//            onlineUsers.forEach((value, key) => {
//                if (value === socket.id) {
//                    onlineUsers.delete(key);
//                    console.log(`❌ User ${key} went offline`);
//                }
//            });
//        });
//
//        // ✅ Handle sending messages
//        socket.on("send-message", async (data) => {
//            const { senderId, receiverId, text } = data;
//
//            // Save message in MongoDB
//            const newMessage = await MessageModel.create({
//                sender: senderId,
//                receiver: receiverId,
//                text,
//                status: "sent", // Default status
//            });
//
//            console.log(`📩 Message from ${senderId} to ${receiverId}: ${text}`);
//
//            // Check if receiver is online
//            const receiverSocketId = onlineUsers.get(receiverId);
//
//            if (receiverSocketId) {
//                // Receiver is online: Send real-time message
//                io.to(receiverSocketId).emit("receive-message", newMessage);
//
//                // Update message status to "delivered"
//                await MessageModel.updateOne(
//                    { _id: newMessage._id },
//                    { $set: { status: "delivered" } }
//                );
//            }
//        });
//
//        // ✅ Handle message seen (receiver opens message)
//        socket.on("message-seen", async (messageId) => {
//            await MessageModel.updateOne(
//                { _id: messageId },
//                { $set: { status: "seen" } }
//            );
//        });
//
//        // ✅ Handle fetching unread messages (When user comes online)
//        socket.on("fetch-unread-messages", async (userId) => {
//            const unreadMessages = await MessageModel.find({
//                receiver: userId,
//                status: "unread",
//            });
//
//            if (unreadMessages.length > 0) {
//                socket.emit("unread-messages", unreadMessages);
//
//                // Mark them as delivered
//                await MessageModel.updateMany(
//                    { receiver: userId, status: "unread" },
//                    { $set: { status: "delivered" } }
//                );
//            }
//        });
//    });
//
//    return io;
//};
