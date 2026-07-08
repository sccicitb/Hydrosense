import { Op, fn, col, literal, Sequelize } from "sequelize";

// Helper function to calculate average data by interval
export async function getAverageDataByInterval(model, interval) {
  let groupByClause;
  let dateFormat;

  // Menentukan cara pengelompokan data berdasarkan interval
  switch (interval) {
    case "daily":
      // Untuk harian, kelompokkan data berdasarkan jam (00:00 - 23:00)
      groupByClause = [fn("date_trunc", literal("'hour'"), col("timestamp"))];
      dateFormat = "'hour'";
      break;

    case "weekly":
      // Untuk mingguan, kelompokkan data berdasarkan hari dimulai dari Senin
      groupByClause = [fn("date_trunc", literal("'day'"), col("timestamp"))];
      dateFormat = "'day'";
      break;

    case "monthly":
      // Untuk bulanan, kelompokkan data berdasarkan hari sesuai dengan jumlah hari dalam bulan
      groupByClause = [fn("date_trunc", literal("'day'"), col("timestamp"))];
      dateFormat = "'day'";
      break;

    default:
      throw new Error("Invalid interval");
  }

  try {
    return await model.findAll({
      attributes: [
        // Menggunakan date_trunc untuk pengelompokan
        [fn("date_trunc", literal(dateFormat), col("timestamp")), "interval"],
        [fn("AVG", col("flow1")), "avg_flow1"],
        [fn("AVG", col("turbidity")), "avg_turbidity"],
        [fn("AVG", col("ph")), "avg_ph"],
        [fn("AVG", col("tds")), "avg_tds"],
      ],
      group: groupByClause, // Mengelompokkan berdasarkan interval
      order: [[literal("interval"), "ASC"]], // Mengurutkan berdasarkan interval
    });
  } catch (err) {
    throw new Error("Error while fetching data: " + err.message);
  }
}
