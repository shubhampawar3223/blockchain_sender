const express = require('express');
const db = require('./models')
const ethers = require('ethers')
require('dotenv').config()
const app = express()
const PORT = process.env.PORT || 3000
let pendingTx = []

// provider creation
let provider = new ethers.providers.InfuraProvider("kovan")

// wallet/signer creation
let wallet = new ethers.Wallet(process.env.privateKey, provider)

db.sequelize.sync().then(async () => {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`)
    })

    sendTx("0.000004","0x3886507ba3C16c60541412D2AaFdB0bdEDa3C532")
})

const sendTx = async (send_token_amount, to_address) => {

    const tx = {
        to: to_address,
        value: ethers.utils.parseEther(send_token_amount),
    }

    wallet.sendTransaction(tx).then(async (transaction) => {
        await db.Transaction.create({
            fromAddress: transaction.from,
            toAddress: transaction.to,
            amount: transaction.value.toBigInt(),
            status: 0,
            process: 1,
            transactionHash: transaction.hash,
        })
        console.log("txHash", transaction.hash)
        let txReciept = await provider.getTransactionReceipt(transaction.hash)
        console.log("processCount", 1)
        if (!txReciept || !txReciept.blockNumber) {
            await transactionUpdate(1, 1, transaction.hash)
            trackTransactions({ hash: transaction.hash, processCount: 1 })
        }
        else {
            await transactionUpdate(2, 1, transaction.hash)
        }
    })
        .catch((err) => {
            console.log(err)
        })
}

//function updated the field in the db
const transactionUpdate = async (status, process, requiredHash) => {
    await db.Transaction.update({ status, process }, {
        where: {
            transactionHash: requiredHash
        }
    })
}

//function to track and confirm the transaction status
const trackTransactions = async (newTxDetails) => {
    pendingTx.push(newTxDetails)
    if (pendingTx.length) {
        let timer = setInterval(async () => {
            await Promise.all(pendingTx.map(async (tx, i) => {
                console.log("processCount", ++tx.processCount)
                let tx_reciept = await provider.getTransactionReceipt(tx.hash)
                //checking if transaction get added to the block
                if (tx_reciept && tx_reciept.blockNumber) {
                    await transactionUpdate(2, tx.processCount, tx.hash)
                    //removing the transaction details from pendingTx array.
                    pendingTx.splice(i, 1)

                    //condition for applying clearInterval.
                    if (!pendingTx.length) {
                        console.log("Success!")
                        clearInterval(timer)
                    }
                }
            }))
        }, 5000)
    }
}