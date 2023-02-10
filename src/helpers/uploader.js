var fs = require('fs')


class Uploader {
    constructor() {
        this.uploadFolder = process.env.UPLOAD_FOLDER
        }


    async uploadFile(req, fileName) {
        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(this.uploadFolder+fileName);
            stream.on('open', () => {
                req.pipe(stream);
            });

            stream.on('close', () => {
                resolve(true);
            });

            stream.on('error', err => {
                reject(false);
            });
        });
    };
    async uploadPartFile(req, path,fileName) {
        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(this.uploadFolder+path+fileName);
            stream.on('open', () => {
                req.pipe(stream);
            });

            stream.on('close', () => {
                resolve(true);
            });

            stream.on('error', err => {
                reject(false);
            });
        });
    };
}

const uploader = new Uploader();
module.exports = uploader;
