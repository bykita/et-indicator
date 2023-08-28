import { launch } from './src/db.js';
import * as cron from 'node-cron';

cron.schedule ('0 0 0 * * *', launch);