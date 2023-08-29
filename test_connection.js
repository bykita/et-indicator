import { Sequelize } from 'sequelize';
import config from './config.json' assert { type: "json" };

const sequelize = new Sequelize(config.db, { logging: false });

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    sequelize.close()
} catch (error) {
    console.error('Unable to connect to the database:', error);
}