import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { IUserDetails } from "../../../types/models.types";

// Тип модели User, унаследованного от Sequelize
export type UserDetailsInstance = IUserDetails & Model & {
  
};

const UserDetailModel = sequelize.define<UserDetailsInstance, IUserDetails>("User_details", {
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
  birthday: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  work: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sex: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

export default UserDetailModel;