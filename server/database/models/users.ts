import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { IUser } from "../../../types/models.types";

interface ISaveUser {
  id: string;
  firstName: string;
  secondName: string;
  thirdName: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

// Тип модели User, унаследованного от Sequelize
export type UserInstance = IUser & Model & {
  getUserData: () => ISaveUser;
};

const UserModel = sequelize.define<UserInstance, IUser>("Users", {
  id: {
    type: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "first_name"
  },
  secondName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "second_name"
  },
  thirdName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "third_name"
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "avatar_url"
  },
  salt: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Определяем метод модели - возвращает безопасный объект пользователя (без соли и пароля)
UserModel.prototype.getUserData = function() {
  return {
    id: this.id,
    firstName: this.firstName,
    secondName: this.secondName,
    thirdName: this.thirdName,
    email: this.email,
    phone: this.phone,
    avatarUrl: this.avatarUrl
  };
};

export default UserModel;