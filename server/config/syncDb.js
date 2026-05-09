import { sequelize } from '../models/index.js';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ force: true });
    console.log('All models synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to sync database:', error);
    process.exit(1);
  }
}

syncDatabase();
