import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { IFriend } from "../../../types/models.types";

// Тип модели Friends, унаследованного от Sequelize
export type FriendsDetailsInstance = IFriend & Model & {
  
};

const FriendsModel = sequelize.define<FriendsDetailsInstance, IFriend>("Friends", {
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
  friendId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    field: "friend_id"
  }
});

export default FriendsModel;