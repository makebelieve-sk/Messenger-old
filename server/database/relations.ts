import ChatsModel from "./models/chats";
import MessagesModel from "./models/messages";
import UserModel from "./models/users";

export default function useRelations() {
    // ONE-TO-MANY (одно сообщение у одного пользователя, но у одного пользователя несколько сообщений)
    // Нужно указывать название foreignKey, здесь userId - это поле в MessagesModel по нему идет LEFT OUTER JOIN ON MessagesModel.userId = UserModel.id
    // Поэтому будет работать:
    //      include: [{
    //          model: UserModel,
    //          as: "User",
    //          attributes: ["firstName", "thirdName", "avatarUrl"]
    //      }]
    UserModel.hasMany(MessagesModel, { foreignKey: "userId" });
    MessagesModel.belongsTo(UserModel, { foreignKey: "userId" });

    ChatsModel.hasMany(MessagesModel, { foreignKey: "chatId" });
    MessagesModel.belongsTo(ChatsModel, { foreignKey: "chatId" });
};