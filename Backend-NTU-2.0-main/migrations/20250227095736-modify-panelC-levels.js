"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PanelCs", "level");
    await queryInterface.addColumn("PanelCs", "level1", {
      type: Sequelize.FLOAT,
    });
    await queryInterface.addColumn("PanelCs", "level2", {
      type: Sequelize.FLOAT,
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PanelCs", "level1");
    await queryInterface.removeColumn("PanelCs", "level2");
    await queryInterface.addColumn("PanelCs", "level", {
      type: Sequelize.FLOAT,
    });
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
