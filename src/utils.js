import * as fs from 'fs';

function sortFilesByDate(filenames) {
    if (filenames.length <= 1) return filenames;

    return filenames.sort ((a, b) => {
        const aObj = dateToObj(a);
        const bObj = dateToObj(b);

        return aObj.yyyy - bObj.yyyy
            || aObj.mm - bObj.mm
            || aObj.dd - bObj.dd;
    })
}

function dateToObj(date) {
    if (date.length < 8) return undefined

    return {
        dd: date.slice(0, 2),
        mm: date.slice(2, 4),
        yyyy: date.slice(4, 8)
    }
}

function getFileList(folder){
    let files = fs.readdirSync(folder);
    files = files.filter(i => i.endsWith('.xlsx'))
    return sortFilesByDate(files);
}

export {getFileList};