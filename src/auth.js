import * as fs from "fs";
import {google} from "googleapis";
import {GoogleAuth} from "google-auth-library";

const FILE_FOLDER_PATH = './files';
const CREDENTIALS_PATH = 'credentials.json';
const SCOPES_PATH = 'https://www.googleapis.com/auth/drive';
const FOLDER_ID = '16fna-52lS_swVIUOB_z3Y5bZ088kjaiF';

async function authorize() {
    const auth = new GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: SCOPES_PATH
    });

    return auth;
}

async function downloadFiles(auth) {
    const service = google.drive({version: 'v3', auth});
    const files = [];

    if (!fs.existsSync(FILE_FOLDER_PATH)){
        fs.mkdirSync(FILE_FOLDER_PATH);
    }

    try {
        const response = await service.files.list({
            q: 'mimeType=\'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\'',
        });
        if (response && response.data && response.data.files) {
            for (const file of response.data.files) {
                files.push(file);
            };

            let pageToken = response.data.nextPageToken;
            while (pageToken) {
                let nextPageResponse = await service.files.list({
                    q: 'mimeType=\'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\'',
                    pageToken,
                });

                for (const file of nextPageResponse.data.files) {
                    files.push(file);
                };

                pageToken = nextPageResponse.data.nextPageToken;
            }

            for (let i = 0; i < files.length; i++) {
                const fileInfo = files[i];

                if (fs.existsSync('files/' + fileInfo.name)) {
                    continue;
                }

                console.log(fileInfo);
    
                const fileStream = fs.createWriteStream('files/' + fileInfo.name);
                const file = await service.files.get({
                    fileId: fileInfo.id,
                    alt: 'media',
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }, {
                    responseType: 'stream'
                });
    
                file.data.on('end', () => console.log(`${fileInfo.name} downloaded (${i+1}/${files.length})`));
                file.data.pipe(fileStream);
            }

        }
    } catch (err) {
        throw err;
    }
}

export {authorize, downloadFiles};