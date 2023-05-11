import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { MessageReadStatus } from "../../../types/enums";
import { IReadMessages } from "../../../types/models.types";

// Тип модели Read_messages, унаследованного от Sequelize
export type ReadMessagesInstance = IReadMessages & Model & {};

const ReadMessagesModel = sequelize.define<ReadMessagesInstance, IReadMessages>("Read_messages", {
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
    messageId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        field: "message_id"
    },
    isRead: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "is_read",
        defaultValue: MessageReadStatus.NOT_READ
    }
});

export default ReadMessagesModel;