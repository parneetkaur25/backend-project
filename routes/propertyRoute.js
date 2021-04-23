const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mssql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get("/getAll",async (req, res) =>
{
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);
        let properties = await pool
                                .request()
                                .query(`SELECT * FROM TProperties WHERE OwnerId = ${req.body.decoded.PersonId}`);
        res
            .status(200)
            .send({
                success : true,
                properties : properties.recordset
            })
    }
    else
    {
        res
            .status(403)
            .send(
                {
                    success : false,
                    erroemessage : "You do not have permission to view this page"
                }
            )

    }
})

router.post("/add",async (req, res) =>
{
    // console.log(req.body.decoded)
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);
        let checkLatestId = (await pool.request().query("SELECT TOP 1 PropertyId FROM TProperties ORDER BY PropertyId DESC"))
                                .recordset[0].PropertyId;
        let properties = await pool
                                .request()
                                .query(
                                    `INSERT INTO TProperties (PropertyId, OwnerId, Latitude, Longitude, CityName, BuildingName, Notes, Address) 
                                    VALUES(
                                    ${checkLatestId+1},
                                    ${req.body.decoded.PersonId},
                                    ${req.body.Latitude},
                                    ${req.body.Longitude},
                                    '${req.body.CityName}',
                                    '${req.body.BuildingName}',
                                    '${req.body.Notes}',
                                    '${req.body.Address}')
                                    `);
        if(properties.rowsAffected[0] < 1)
        {
            res
            .status(500)
            .send({
                success : false,
                erroemessage : "Could not insert this new property. Please try later."
            })
        }
        else
        {
            res
            .status(200)
            .send({
                success : true,
                property : {
                    PropertyId : checkLatestId +1,
                    OwnerId : req.body.decoded.PersonId,
                    Latitude : req.body.Latitude,
                    Longitude : req.body.Longitude,
                    CityName : req.body.CityName,
                    BuildingName : req.body.BuildingName,
                    Notes : req.body.Notes,
                    Address : req.body.Address
                }
            })
        }
    }
    else
    {
        res
            .status(403)
            .send(
                {
                    success : false,
                    erroemessage : "You do not have permission to view this page"
                }
            )

    }
})

router.patch("/modify/:propertyId",async (req, res) =>
{
    // console.log(req.body.decoded)
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);
        let properties = await pool
                                .request()
                                .query(
                                    `UPDATE TProperties 
                                    SET 
                                    OwnerId = ${req.body.decoded.PersonId},
                                    Latitude = ${req.body.Latitude},
                                    Longitude = ${req.body.Longitude},
                                    CityName = '${req.body.CityName}',
                                    BuildingName = '${req.body.BuildingName}',
                                    Notes = '${req.body.Notes}',
                                    Address = '${req.body.Address}'

                                    WHERE PropertyId = ${req.params.propertyId}
                                    `);
        if(properties.rowsAffected[0] < 1)
        {
            res
            .status(500)
            .send({
                success : false,
                erroemessage : "Could not insert this new property. Please try later."
            })
        }
        else
        {
            res
            .status(200)
            .send({
                success : true,
                property : {
                    PropertyId : req.params.propertyId,
                    OwnerId : req.body.decoded.PersonId,
                    Latitude : req.body.Latitude,
                    Longitude : req.body.Longitude,
                    CityName : req.body.CityName,
                    BuildingName : req.body.BuildingName,
                    Notes : req.body.Notes,
                    Address : req.body.Address
                }
            })
        }
    }
    else
    {
        res
            .status(403)
            .send(
                {
                    success : false,
                    erroemessage : "You do not have permission to view this page"
                }
            )

    }
})

router.delete("/delete/:propertyId",async (req, res) =>
{
    // console.log(req.body.decoded)
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);
        let properties = await pool
                                .request()
                                .query(
                                    `DELETE FROM TProperties WHERE PropertyId = ${req.params.propertyId}
                                    `);
        if(properties.rowsAffected[0] < 1)
        {
            res
            .status(500)
            .send({
                success : false,
                erroemessage : "Could not delete this property. Please try later."
            })
        }
        else
        {
            res
            .status(200)
            .send({
                success : true
            })
        }
    }
    else
    {
        res
            .status(403)
            .send(
                {
                    success : false,
                    erroemessage : "You do not have permission to view this page"
                }
            )

    }
})


module.exports = router;