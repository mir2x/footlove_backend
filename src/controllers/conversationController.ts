import Conversation from "@models/conversationModel";

const findOrCreateConversation = async (userId1: string, userId2: string) => {
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId1, userId2],
        messages: [],
      });
      await conversation.save();
    }

    return conversation;
  };

const ConversationController = {
    findOrCreateConversation
}

export default ConversationController;