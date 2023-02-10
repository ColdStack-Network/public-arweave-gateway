var Arw = require('arweave')

class Arweave {
    constructor() {
        this.uploadFolder = process.env.UPLOAD_FOLDER
        this.arweave = Arw.init({
            host:'arweave.net',
            protocol:'https'
        });
        this.key = process.env.ARWEAVE_CREDENTIALS

    }

    async uploadSimpleFile(data){
        let transaction = await this.arweave.createTransaction({data},this.key)
        await this.arweave.transactions.sign(transaction, this.key)

        let response = await this.arweave.transactions.post(transaction);
        console.log(response);
        console.log(transaction)
        return new Promise((resolve, reject) => {
            resolve(transaction.id)
        })
    }

    async getDataTransaction(tx_id){
        return this.arweave.transactions.getData(tx_id, {decode: true, string: true})
    }

}

const arweave = new Arweave();
module.exports = arweave