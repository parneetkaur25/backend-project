const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mssql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();


router.post('/register', async function(req, res)
{
    let pool = await new mssql.connect(config.dbConfig);
    let checkLatestId = await pool.request().query("SELECT TOP 1 PersonId FROM TPeople ORDER BY PersonId DESC");
    let lastId = checkLatestId.recordset[0].PersonId;
    var hashedPassword = bcrypt.hashSync(req.body.password, config.saltrounds);
    await pool.request().query(`INSERT INTO TPeople (PersonId, PersonName, Password, Role) VALUES(${lastId+1}, '${req.body.username}', '${hashedPassword}', '${req.body.role}')`);
    let newUserInserted = (await pool.request().query(`SELECT PersonId, PersonName, Role FROM TPeople WHERE PersonId = ${lastId}`)).recordset[0];
    let jwtToken = jwt.sign(newUserInserted, config.secret, { expiresIn: '1h' })
    res.json({ 
        userid : newUserInserted["PersonId"],
        name : newUserInserted["PersonName"],
        token : jwtToken
     });
})

router.post('/login', async function(req, res)
{
    let pool = await new mssql.connect(config.dbConfig);
    var hashedPassword = bcrypt.hashSync(req.body.password, config.saltrounds);
    let loggedInUser = [].concat((await pool.request().query(`SELECT PersonId, Password, Role FROM TPeople WHERE PersonName = '${req.body.username}'`)).recordset);
    if(loggedInUser.length > 0)
    {
        if(bcrypt.compareSync(req.body.password, loggedInUser[0].Password))
        {
            let jwtToken = jwt.sign({
                PersonId : loggedInUser[0].PersonId,
                PersonName : req.body.username,
                Role : loggedInUser[0].Role

            }, config.secret, { expiresIn: '1h' })

            res.status(200).send(
                { 
                    userid : loggedInUser[0]["PersonId"],
                    name : req.body.username,
                    token : jwtToken
                 }
            )
        }
        else
            res.status(401).send({
                success : false,
                errormessage : "Password did not match"
            })

    }
    else
        res.status(404).send({
            success : false,
            errormessage : "No user found with this username"
        })
    
    // res.json(loggedInUser)
})

router.get('/getContact/:userId', async (req, res)=>
{
    let pool = await new mssql.connect(config.dbConfig);
    let user = (await pool.request().query(`SELECT PersonName FROM TPeople WHERE PersonId = ${req.params.userId}`)).recordset[0];
    res.status(200)
        .send({
            Name : user.PersonName,
            email : "".concat(user.PersonName).toLowerCase().replace(" ",".").concat("@email.com"),
            phone : "998021234"
        })
})


module.exports = router;