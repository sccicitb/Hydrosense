"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PanelDs", "level");
    await queryInterface.addColumn("PanelDs", "level1", {
      type: Sequelize.FLOAT,
    });
    await queryInterface.addColumn("PanelDs", "level2", {
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
    await queryInterface.removeColumn("PanelDs", "level1");
    await queryInterface.removeColumn("PanelDs", "level2");
    await queryInterface.addColumn("PanelDs", "level", {
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
