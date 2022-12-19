import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { CallNames, CallTypes } from "../../../types/enums";
import { ICall } from "../../../types/models.types";

// Тип модели Calls, унаследованного от Sequelize
export type CallsDetailsInstance = ICall & Model & {};

const CallsModel = sequelize.define<CallsDetailsInstance, ICall>("Calls", {
    id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: CallNames.OUTGOING
    },
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: CallTypes.SINGLE
    },
    initiatorId: {
        type: DataTypes.UUIDV4,
        allowNull: true,
        field: "initiator_id"
    },
    chatId: {
        type: DataTypes.UUIDV4,
        allowNull: true,
        field: "chat_id"
    },
    userIds: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "user_ids"
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "start_time"
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "end_time"
    },
});

export default CallsModel;