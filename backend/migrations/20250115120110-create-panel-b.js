'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PanelBs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      timestamp: {
        type: Sequelize.DATE
      },
      flow1: {
        type: Sequelize.FLOAT
      },
      flow2: {
        type: Sequelize.FLOAT
      },
      turbidity: {
        type: Sequelize.FLOAT
      },
      ph: {
        type: Sequelize.FLOAT
      },
      tds: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PanelBs');
  }
};