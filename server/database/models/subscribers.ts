import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { ISubscriber } from "../../../types/models.types";

// Тип модели Subscribers, унаследованного от Sequelize
export type SubscribersDetailsInstance = ISubscriber & Model & {
  
};

const SubscribersModel = sequelize.define<SubscribersDetailsInstance, ISubscriber>("Subscribers", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    field: "user_id"
  },
  subscriberId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    field: "subscriber_id"
  },
  leftInSubs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "left_in_subs"
  }
});

export default SubscribersModel;