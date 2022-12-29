import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { MessageReadStatus, MessageTypes } from "../../../types/enums";
import { IMessage } from "../../../types/models.types";

// Тип модели Messages, унаследованного от Sequelize
export type MessagesDetailsInstance = IMessage & Model & {};

const MessagesModel = sequelize.define<MessagesDetailsInstance, IMessage>("Messages", {
  id: {
    type: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    field: "user_id"
  },
  chatId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    field: "chat_id"
  },
  files: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: MessageTypes.MESSAGE
  },
  createDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "create_date"
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: MessageReadStatus.NOT_READ,
    field: "is_read"
  },
  callId: {
    type: DataTypes.UUIDV4,
    allowNull: true,
    field: "call_id"
  }
});

export default MessagesModel;