"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PanelD extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PanelD.init(
    {
      timestamp: DataTypes.DATE,
      level1: DataTypes.FLOAT,
      level2: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "PanelD",
    }
  );
  return PanelD;
};
