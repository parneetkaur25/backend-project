const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mssql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get("/getAll", async (req, res) => {
    if(req.body.decoded.Role.toLowerCase() == "owner" || 1==1)
    {
        let pool = await new mssql.connect(config.dbConfig);
        var workspaces = [];
         
        for(let item of 
            [].concat(
                (await pool
                    .request()
                    .query(`SELECT TL.PropertyId, TL.ListingType, TL.Price, TL.Available, TL.ListingId 
                                            FROM TListings AS TL
                                            INNER JOIN TProperties AS TP
                                            ON TL.PropertyId = TP.PropertyId`)).recordset))
        {
    
            item['Amenities'] = (await pool
                .request()
                .query(`SELECT TA.AmenityId, TA.AmenityName 
                            FROM TListingAmenities AS TLA
                            INNER JOIN TAmenities AS TA 
                            ON TLA.AmenityId = TA.AmenityId 
                            AND TLA.ListingId = ${item.ListingId}
                            `)).recordset
            workspaces.push(item)
        }
        res
            .status(200)
            .send({
                success: true,
                workspaces: workspaces
            })
    }
    else
    {
        res
            .status(403)
            .send({
                success: false,
                errormessage : "You do not have permission to view this page"
            })
    }
    
})

router.get("/details/:listingId", async (req, res) => {
    let pool = await new mssql.connect(config.dbConfig);
    var workspaces = [];
     
    for(let item of 
        [].concat(
            (await pool
                .request()
                .query(`SELECT TL.PropertyId, TL.ListingType, TL.Price, TL.Available, TL.ListingId 
                                        FROM TListings AS TL
                                        INNER JOIN TProperties AS TP
                                        ON TL.PropertyId = TP.PropertyId
                                        AND TL.ListingId = ${req.params.listingId}`)).recordset))
    {

        item['Amenities'] = (await pool
            .request()
            .query(`SELECT TA.AmenityId, TA.AmenityName 
                        FROM TListingAmenities AS TLA
                        INNER JOIN TAmenities AS TA 
                        ON TLA.AmenityId = TA.AmenityId 
                        AND TLA.ListingId = ${item.ListingId}
                        `)).recordset
        workspaces.push(item)
    }
    res
        .status(200)
        .send({
            success: true,
            workspaces: workspaces
        })
})

router.get("/viewAllAmenities", async (req, res) => {
    let pool = await new mssql.connect(config.dbConfig);
    let amenities = (await pool
        .request()
        .query(`SELECT * FROM TAmenities`)).recordset;
     
    res
        .status(200)
        .send({
            success: true,
            amenities: amenities
        })
})

router.post('/add', async (req, res) =>
{
    if (req.body.decoded.Role.toLowerCase() == "owner") 
    {
        let pool = await new mssql.connect(config.dbConfig);
        let checkLatestId = await pool.request().query("SELECT TOP 1 ListingId FROM TListings ORDER BY ListingId DESC");
        let lastId = checkLatestId.recordset[0].ListingId;

        try {
            await pool.request().query(`
            INSERT INTO TListings (ListingId, PropertyId, ListingType, Price, Available)
            VALUES (${lastId + 1}, ${req.body.PropertyId}, '${req.body.ListingType}', ${req.body.Price},${req.body.Available})`);

            [].concat(req.body.AmenityIds).forEach(async item => {
                await pool.request().query(
                    `INSERT INTO TListingAmenities (ListingId, AmenityId)
                    VALUES (${lastId + 1}, ${item})`)
            })


            res
                .status(200)
                .send({
                    success: true,
                    workspace: {
                        ListingId: lastId + 1,
                        PropertyId: req.body.PropertyId,
                        ListingType: req.body.ListingType,
                        Price: req.body.Price,
                        Available: req.body.Available,
                        AmenityIds: req.body.AmenityIds
                    }
                })
        }
        catch (err) {
            console.log(err)
            res
                .status(500)
                .send({
                    success: false,
                    errormessage: "Listing of workspace could not be completed. Please contact developer.",
                    err: err.message
                })
        }
    }
    else
    {
        res
            .status(403)
            .send({
                success: false,
                errormessage : "You do not have permission to view this page"
            })
    }
})

router.patch('/modify/:listingId', async (req, res) =>
{
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);

        try {
            await pool.request().query(`
                UPDATE TListings
                SET 
                PropertyId = ${req.body.PropertyId},
                ListingType = '${req.body.ListingType}', 
                Price = ${req.body.Price},
                Available = ${req.body.Available}
                WHERE ListingId = ${req.params.listingId}`);
            
            [].concat(req.body.AmenityIds).forEach(async item =>
                {
                    await pool.request().query(
                        `DELETE FROM TListingAmenities
                        WHERE ListingId = ${req.params.listingId}`)
            });
    
            [].concat(req.body.AmenityIds).forEach(async item => {
                await pool.request().query(
                    `INSERT INTO TListingAmenities (ListingId, AmenityId)
                            VALUES (${req.params.listingId}, ${item})`)
            })
            
    
            res
                .status(200)
                .send({
                    success: true,
                    workspace: {
                        ListingId: req.params.listingId,
                        PropertyId: req.body.PropertyId,
                        ListingType: req.body.ListingType,
                        Price: req.body.Price,
                        Available: req.body.Available,
                        AmenityIds : req.body.AmenityIds
                    }
                })
        }
        catch(err)
        {
            console.log(err)
            res
                .status(500)
                .send({
                    success: false,
                    errormessage: "Listing of workspace could not be completed. Please contact developer.",
                    err : err.message
                })
        }
    }
    else
    {
        res
            .status(403)
            .send({
                success: false,
                errormessage : "You do not have permission to view this page"
            })
    }
    
})

router.delete('/delete/:listingId', async (req, res) =>
{
    if(req.body.decoded.Role.toLowerCase() == "owner")
    {
        let pool = await new mssql.connect(config.dbConfig);

        try {
            await pool.request().query(`
                DELETE FROM TListings
                WHERE ListingId = ${req.params.listingId}`);
            await pool.request().query(
                `DELETE FROM TListingAmenities
                    WHERE ListingId = ${req.params.listingId}`);
    
        
            res
                .status(200)
                .send({
                    success: true
                })
        }
        catch(err)
        {
            console.log(err)
            res
                .status(500)
                .send({
                    success: false,
                    errormessage: "Listing of workspace could not be completed. Please contact developer.",
                    err : err.message
                })
        }
    }
    else
    {
        res
            .status(403)
            .send({
                success: false,
                errormessage : "You do not have permission to view this page"
            })
    }
    
})

module.exports = router;