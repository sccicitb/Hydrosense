"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PanelC extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PanelC.init(
    {
      timestamp: DataTypes.DATE,
      level1: DataTypes.FLOAT,
      level2: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "PanelC",
    }
  );
  return PanelC;
};
