'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PanelA extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PanelA.init({
    timestamp: DataTypes.DATE,
    flow1: DataTypes.FLOAT,
    turbidity: DataTypes.FLOAT,
    ph: DataTypes.FLOAT,
    tds: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'PanelA',
  });
  return PanelA;
};