const Sequelize = require('sequelize')
const Files_upload = require('./file_upload')

const sequelize = new Sequelize(process.env.PGSQL_DB, process.env.PGSQL_USER, process.env.PGSQL_PASS, {
    host: process.env.PGSQL_HOST,
port: process.env.PGSQL_PORT,
    syncOnAssociation: false,
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
});

const files_upload = Files_upload(sequelize)

async function init() {
    await sequelize.sync({force: false})
        .catch((e) => {
            console.log('Error DB init : ', e)
        })
}

module.exports = {
    init,
    files_upload
}
