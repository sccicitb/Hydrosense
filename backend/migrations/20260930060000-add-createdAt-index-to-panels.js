"use strict";

// Every panel table's data is queried by createdAt (order by, and now also
// range filters for the weekly leakage report) with no supporting index -
// on tables with 100k+ rows this turned a range query into a full table
// scan + filesort, taking 40+ seconds. Adding a plain index fixes both the
// existing "/latest" endpoints and the new weekly leakage query.
const TABLES = ["PanelAs", "PanelBs", "PanelCs", "PanelDs", "PanelEs"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.addIndex(table, ["createdAt"], {
        name: `${table.toLowerCase()}_created_at_idx`,
      });
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.removeIndex(table, `${table.toLowerCase()}_created_at_idx`);
    }
  },
};
