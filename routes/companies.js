const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router()

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT code, name 
                FROM companies 
                ORDER BY name`
        );
  
        return res.json({ companies: result.rows });
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT code, name, description
                FROM companies
                WHERE code = $1`, 
            [req.params.code]
        );
        if (result.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code '${req.params.code}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({ company: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body
        const result = await db.query(
            `INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [req.body.code, req.body.name, req.body.description]
        );

        return res.status(201).json({ company: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body
        const code = req.params.code

        const result = await db.query(
            `UPDATE companies 
                SET name = $1, description = $2
                WHERE code = $3
                RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
        }

        return res.status(201).json({ company: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM companies 
                WHERE code = $1 
                RETURNING code`, 
            [req.params.code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
        }

        return res.json({ status: "deleted" });

    } catch(err) {
        return next(err)
    }
});

module.exports = router;