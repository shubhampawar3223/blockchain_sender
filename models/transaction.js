module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define("Transaction", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        fromAddress: {
            type: DataTypes.STRING,
        },
        toAddress: {
            type: DataTypes.STRING,
        },
        amount: {
            type: DataTypes.BIGINT,
        },
        status: {
            type: DataTypes.INTEGER,
            validate: {
                isIn: [[0, 1, 2]]
            }
        },
        process: {
            type: DataTypes.INTEGER,
        },
        timestamp: {
            type: DataTypes.DATE,
        },
        transactionHash: {
            type: DataTypes.STRING,
        },
    })
    return Transaction;
}