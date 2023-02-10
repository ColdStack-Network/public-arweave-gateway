const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('files_upload', {
        id: {
            type: DataTypes.INTEGER,
            unique:true,
            autoIncrement: true,
            primaryKey:true
        },
        blockchain_hash: {
            type: DataTypes.STRING
        },
        file_name: {
            type: DataTypes.STRING,
        },
        storage_hash: {
            type: DataTypes.STRING
        },
        upload_status: {
            type:DataTypes.INTEGER,
            defaultValue:0
        }
    })
}