const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const mssql = require('mssql');
const cors = require('cors');
const config = require('./config');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(express.json())
app.use(bodyparser.urlencoded({
    extended: false
}))
app.use(cors());
app.use('/', (req, res, next) =>
{
    // console.log(req.path)
    if(req.path.startsWith('/common/'))
    {
        // console.log(req.path)
        return next();
    }
    else
    {
        jwt.verify(req.headers.authorization.replace("Bearer ",""), config.secret,function(err, decoded)
        {
            if(err)
            {
                res.status(401).send(
                    {
                        success : false,
                        errormessage : "Token Invalid. Please login again."
                    }
                )
            }
            else
            {
                req.body.decoded = decoded;
                next();
            }
        })           
    }
})
app.use('/common', require('./routes/commonRoute'))
app.use('/property', require('./routes/propertyRoute'))
app.use('/workspace', require('./routes/workspaceRoute'));

app.listen(port, () => console.log(`App is running on port ${port}`))

/**
 *  POST    /common/login                   Done
 *  POST    /common/register                Done
 *  GET     /getContact/:userID             Done
 *  -------------------------------------------------
 *  POST    /workspace/add                  Done
 *  PATCH   /workspace/modify/:listingId    Done
 *  DELETE  /workspace/delete/:listingId    Done
 *  GET     /workspace/getAll               Done
 *  GET     /workspace/details/:listingId   Done
 *  GET     /workspace/viewAllAmenities     Done
 *  -------------------------------------------------
 *  POST    /property/add                   Done
 *  PATCH   /property/modify/:propertyId    Done
 *  DELETE  /property/delete/:propertyId    Done
 *  GET     /property/getAll                Done
 */