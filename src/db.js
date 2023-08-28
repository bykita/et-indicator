import { getFileList } from './utils.js';
import { authorize, downloadFiles } from './auth.js';
import { getTableInfo } from './xlsx.js';
import { Sequelize, Op } from 'sequelize';
import config from '../config.json' assert { type: "json" };

const FILE_FOLDER_PATH = './files/';

const sequelize = new Sequelize(config.db, { logging: false });

const TrainRuns = sequelize.define('train_runs', {
    file: Sequelize.STRING,
    no: Sequelize.STRING,
    cargo: Sequelize.STRING,
    weight: Sequelize.DECIMAL,
    time: Sequelize.DECIMAL,
    month_start: Sequelize.STRING,
    datetime_start: Sequelize.DATE,
    date_start: Sequelize.DATEONLY,
    station_start: Sequelize.STRING,
    road_start: Sequelize.STRING,
    operation_start: Sequelize.STRING,
    cargo_sender: Sequelize.STRING,
    month_end: Sequelize.STRING,
    datetime_end: Sequelize.DATE,
    station_end: Sequelize.STRING,
    cargo_receiver: Sequelize.STRING,
    station_dest: Sequelize.STRING,
    road_dest: Sequelize.STRING,
    operation_finish: Sequelize.STRING,
    operator: Sequelize.STRING,
    renter: Sequelize.STRING,
    proprietor: Sequelize.STRING,
    rps: Sequelize.STRING,
    state: Sequelize.STRING,
    msg_type: Sequelize.STRING,
    shipment_type: Sequelize.STRING,
    is_finished: Sequelize.STRING,
    is_late: Sequelize.STRING,
    is_repaired: Sequelize.STRING,
    loaded_or_empty: Sequelize.STRING,
    total_range: Sequelize.INTEGER,
    RF_range: Sequelize.INTEGER,
    indoor_range: Sequelize.INTEGER,
    model_code: Sequelize.STRING,
    payload: Sequelize.INTEGER,
    body_volume: Sequelize.DECIMAL,
    idle_days: Sequelize.INTEGER,
    idle_days_loaded: Sequelize.INTEGER,
}, {
    indexes: [
        {
            unique: true,
            fields: ['no', 'station_start', 'date_start']
        }
    ]
});

const UsedFiles = sequelize.define('used_files', {
    file: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
});

async function launchDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    
    await TrainRuns.sync();
    await UsedFiles.sync();
}

async function launch() {
    await launchDB();

    const auth = await authorize();
    await downloadFiles(auth);

    const fileList = getFileList(FILE_FOLDER_PATH);

    let usedFiles = await UsedFiles.findAll({
        attributes: ['file'],
        group: ['file']
    })

    usedFiles = usedFiles.map (i => i.file);

    for (let file of fileList) {
        if (usedFiles.includes(file)) {
            continue;
        }

        let data = getTableInfo(file);
        let startTime = new Date();
        for (let i = 1; i < data.length; i++) {
            const runInfo = data[i];
            delete runInfo.OrdCol;

            const date = runInfo.datetime_start.split(' ')[0];
            const defaults = {
                ...runInfo,
                is_deleted: false,
                date_start: date,
                file,
            }

            let [trainRun, created] = await TrainRuns.findCreateFind({
                where: {
                    no: runInfo.no,
                    date_start: date,
                    station_start: runInfo.station_start
                },
                defaults
            });

            if (!created) {
                if (new Date(trainRun.datetime_start) < new Date(runInfo.datetime_start)) {
                    await TrainRuns.update(defaults, {
                        where: {
                            id: trainRun.id
                        }
                    })
                }
            }

            const getDateDifference = (dateStart, dateEnd) => {
                const oneDay = 24 * 60 * 60 * 1000; 
                const firstDate = new Date(dateStart);
                const secondDate = new Date(dateEnd);

                return Math.round(Math.abs((firstDate - secondDate) / oneDay));
            }

            let prevTrainRun = await TrainRuns.findOne({
                attributes: [
                    Sequelize.fn('MAX', Sequelize.col('datetime_end')),
                ],
                where: {
                    no: trainRun.no,
                    datetime_end: {
                        [Op.lte]: trainRun.datetime_start
                    }
                },
                raw: true
            })

            if (prevTrainRun.max !== null) {
                trainRun.idle_days = getDateDifference(prevTrainRun.max, trainRun.datetime_start);;
            }

            if (trainRun.loaded_or_empty === 'Груженый') {
                prevTrainRun = await TrainRuns.findOne({
                    attributes: [
                        Sequelize.fn('MAX', Sequelize.col('datetime_end')),
                    ],
                    where: {
                        no: trainRun.no,
                        loaded_or_empty: trainRun.loaded_or_empty,
                        datetime_end: {
                            [Op.lte]: trainRun.datetime_start
                        }
                    },
                    raw: true
                })
        
                if (prevTrainRun.max !== null) {
                    trainRun.idle_days_loaded = getDateDifference(prevTrainRun.max, trainRun.datetime_start);;
                }
            };

            trainRun.save();
        }

        await UsedFiles.create({ file });

        let endTime = new Date();
        let timeDiff = (endTime - startTime) / 1000;
        console.log(`${file} finished parsing ${data.length - 1} rows in ${timeDiff} seconds`);
    }

}

export {launch};