const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router()



router.post('/', async (req, res, next) => {
    try {
        const { code, name } = req.body
        const result = await db.query(
            `INSERT INTO industries (code, name)
                VALUES ($1, $2)
                RETURNING code, name`,
            [code, name]
        );

        return res.status(201).json({ industry: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT i.code, i.name, c.code AS companies
                FROM industries i
                FULL JOIN company_industry ci
                ON ci.ind_code = i.code
                FULL JOIN companies c
                ON c.code = ci.comp_code`
        );


        const processedRes = result.rows.reduce((ind, {code, name, companies}) => {
            ind[name] ??= {code: code, companies: []};
            if (Array.isArray(companies)) {
                ind[name].value = ind[name].value.concat(companies);
            } else {
                ind[name].companies.push(companies);
            }
            return ind;
        }, {});
                
        return res.json({ industries: [processedRes] });
    }
    catch (err) {
        return next(err);
    }
});


router.post('/companies', async (req, res, next) => {
    try {
        const { comp_code, ind_code } = req.body
        const result = await db.query(
            `INSERT INTO company_industry (comp_code, ind_code)
                VALUES ($1, $2)
                RETURNING comp_code, ind_code`,
            [comp_code, ind_code]
        );

        return res.status(201).json({ success: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

module.exports = router;