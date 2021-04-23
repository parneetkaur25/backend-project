const config = {
    dbConfig : {
        user : "testlogin",
        password : "123456",
        server : "localhost",
        database : "demoDB",
        options : {
            trustedconnection: true,
            enableArithAbort:true,
            instancename : 'MASTERMIND'
        },
        port : 1433
    },
    saltrounds : 10,
    secret : "secretKey"
}

module.exports = config;