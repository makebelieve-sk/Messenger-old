import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { IChat } from "../../../types/models.types";

// Тип модели Chats, унаследованного от Sequelize
export type ChatsDetailsInstance = IChat & Model & {};

const ChatsModel = sequelize.define<ChatsDetailsInstance, IChat>("Chats", {
  id: {
    type: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userIds: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "user_ids"
  }
});

export default ChatsModel;