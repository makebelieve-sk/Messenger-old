import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { IFile } from "../../../types/models.types";

// Тип модели Files, унаследованного от Sequelize
export type FilesDetailsInstance = IFile & Model & {};

const FilesModel = sequelize.define<FilesDetailsInstance, IFile>("Files", {
  id: {
    type: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  path: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

export default FilesModel;