import Conversation from "@models/conversationModel";

const findOrCreateConversation = async (userId1: string, userId2: string) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId1, userId2] }
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [userId1, userId2],
      messages: []
    });
    await conversation.save();
  }

  return conversation;
};


const findConversation = async (userId1: string, userId2: string): Promise<any> => await Conversation.findOne({
  participants: { $all: [userId1, userId2] }
}).populate("messages");


const getUserConversations = async (userId: string): Promise<any> => await Conversation.find({
  participants: userId
}).populate("participants", "userName avatar")
  .populate({
    path: "messages",
    options: { sort: { createdAt: -1 }, limit: 1 }
  });


const ConversationController = {
  findOrCreateConversation,
  findConversation,
  getUserConversations
};

export default ConversationController;
