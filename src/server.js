require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.APP_PORT
const uploader = require('./helpers/uploader')
const db = require('./models/db')
const fetch = require('node-fetch');
var fs = require('fs')
var logger = require('./helpers/logger');
var arweave = require('./helpers/arweave');
const checkMd5Hash = require('./helpers/check-md5-hash');
app.use(express.json())

function isAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (auth === 'Bearer ' + process.env.AUTH_TOKEN_FILENODE) {
        next();
    } else {
        res.status(401);
        res.send('Access forbidden');
    }
}

app.post('/cost', isAuth, async (req, res) => {
    try {
        let files = req.body.files;
        if (files.length == 0) {
            res.status(400).text('Bad request')
        }

        let resp = []

        var priceAR = await fetch(process.env.ORACLE_URL + '/price?fromSymbol=AR&toSymbol=USDT');
        priceAR = await priceAR.json()
        priceAR = priceAR.price

        var priceCLS = await fetch(process.env.ORACLE_URL + '/price?fromSymbol=CLS&toSymbol=USDT');
        priceCLS = await priceCLS.json()
        priceCLS = priceCLS.price

        for (const file of files) {
            const oldHash = await db.files_final.findOne({where: {blockchain_hash: file.toLowerCase()}})
            if (oldHash === null) {
                resp.push({file: file, cost: null});
                continue;
            }

            let length = Buffer.from(await arweave.getDataTransaction(oldHash.storage_hash))
            length = length.byteLength

            let price = await fetch('https://arweave.net/price/' + parseInt(length) + '/');
            price = await price.text()

            if (price && length) {
                resp.push({
                    file: file,
                    cost: Math.floor(((length / Math.pow(10, 12)) * priceAR) / priceCLS * Math.pow(10, 18))
                })
            } else {
                resp.push({file: file, cost: null})
            }
        }
        res.json(resp)
    } catch (e) {
        res.status(400).json()
    }
})


app.post('/get-upload-statuses', isAuth, async (req, res) => {
    let files = req.body.file_hashes;
    let response = {}
    for (const file of files) {
        let file_check = await db.files_upload.findOne({where: {blockchain_hash: file}})
        if (file_check) {
            response[file] = {
                status: 'completed',
                location: file_check.storage_hash
            }
        } else {
            response[file] = {
                status: 'pending',
                location: 'file'
            }
        }
    }
    res.json(response)
})

app.post('/set-file-hash', isAuth, async (req, res) => {
    let hash = req.query.idempotency_id;
    let newHash = req.query.file_hash
    let file = await db.files_upload.findOne({where: {file_name: hash}})
    if (file) {
        await file.update({blockchain_hash: newHash})
    }
    res.json({hash})
})

app.get('/download-file', isAuth, async (req, res) => {
    let hash = req.query.file_hash;
    let oldHash = await db.files_upload.findOne({where: {blockchain_hash: hash}})
    if (oldHash.upload_status !== 1) {
        fs.createReadStream(process.env.UPLOAD_FOLDER + oldHash.file_name).pipe(res)
    } else {
        res.send(await arweave.getDataTransaction(oldHash.storage_hash))
    }

})

app.put('/upload', isAuth, async (req, res) => {
    try {
        checkMd5Hash(req);
    } catch (err) {
        logger.error('Exception from upload while checking md5-content', err)
        return res.status(400).json(err);
    }

    try {
        let hash = req.query.idempotency_id;
        logger.info('Start new singleUpload with hash: ' + hash)
        await uploader.uploadFile(req, hash)
        logger.info('Finish new singleUpload with hash: ' + hash)
        let upl = await db.files_upload.create({file_name: hash})
        res.json({hash: hash})
        let tx_id = await arweave.uploadSimpleFile(fs.readFileSync(process.env.UPLOAD_FOLDER + hash))
        await upl.update({storage_hash: tx_id, upload_status: 1})
        await fs.unlink(process.env.UPLOAD_FOLDER + hash)
    } catch (e) {
        logger.error('Exception from upload ', e)
        res.status(400).json({error: "Start Upload fail"})
    }

})


async function start() {
    await db.init()
    return app.listen(port, () => logger.info('Server start on ' + port))
}

start()
module.exports = app
  
