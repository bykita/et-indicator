import * as XLSX from "xlsx";
import { read } from "xlsx/xlsx.mjs";
import { readFileSync } from "fs";

const header = [
    'OrdCol',
    'no',
    'cargo',
    'weight',
    'time',
    'month_start',
    'datetime_start',
    'station_start',
    'road_start',
    'operation_start',
    'cargo_sender',
    'month_end',
    'datetime_end',
    'station_end',
    'cargo_receiver',
    'station_dest',
    'road_dest',
    'operation_finish',
    'operator',
    'renter',
    'proprietor',
    'rps',
    'state',
    'msg_type',
    'shipment_type',
    'is_finished',
    'is_late',
    'is_repaired',
    'loaded_or_empty',
    'total_range',
    'RF_range',
    'indoor_range',
    'model_code',
    'payload',
    'body_volume'
];

function getTableInfo(filename) {
    const buf = readFileSync('./files/' + filename);
    const wb = read(buf);

    const sheetNameList = wb.SheetNames;
    const worksheet = wb.Sheets[sheetNameList[1]]

    const data = XLSX.utils.sheet_to_json (worksheet, {header});

    return data;
}

export {getTableInfo};