const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router()

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT id, comp_code 
                FROM invoices 
                ORDER BY id`
        );
  
        return res.json({ invoices: result.rows });
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.*
                FROM invoices i
                JOIN companies c
                ON c.code = i.comp_code
                WHERE i.id = $1`, 
            [req.params.id]
        );
        if (result.rows.length === 0) {
            let notFoundError = new Error(`There is no invoice with id '${req.params.id}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({ invoice: {
                            id: result.rows[0].id,
                            amt: result.rows[0].amt,
                            paid: result.rows[0].paid,
                            add_date: result.rows[0].add_date,
                            company: {
                                code: result.rows[0].code,
                                name: result.rows[0].name,
                                description: result.rows[0].description,
                                }
                            }
                        });
    } catch(err) {
        return next(err)
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
                VALUES ($1, $2)
                RETURNING id, comp_code, amt, paid, add_date, paid_date `,
            [comp_code, amt]
        );

        return res.status(201).json({ invoice: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { amt, paid } = req.body
        const paidDate = null

        const currInvoice = await db.query(
            `SELECT paid 
                FROM invoices
                WHERE id = $1`,
            [req.params.id]
        );

        if (currInvoice.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);
        }

        const currPaidDate = currInvoice.rows[0].paid_date

        if (paid && !currPaidDate) {
            paidDate = new Date()
        } else if (!paid) {
            paidDate = null
        } else {
            paidDate = currPaidDate
        }

        const result = await db.query(
            `UPDATE invoices 
                SET amt = $1, paid = $2, paid_date = $3
                WHERE id = $3
                RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, req.params.id]
        );

        return res.status(201).json({ invoice: result.rows[0] });

    } catch(err) {
        return next(err)
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM invoices 
                WHERE id = $1 
                RETURNING id`, 
            [req.params.id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.id}`, 404);
        }

        return res.json({ status: "deleted" });

    } catch(err) {
        return next(err)
    }
});

router.get('/companies/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT c.*, i.*
                FROM companies c
                JOIN invoices i
                ON i.comp_code = c.code
                WHERE c.code = $1`, 
            [req.params.code]
        );
        if (result.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code '${req.params.code}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        let invoicesArr = []
        for (let row of result.rows) {
            const invoices = {
                'id': row.id,
                'comp_code': row.comp_code,
                'amt': row.amt,
                'paid': row.paid,
                'add_date': row.add_date,
                'paid_date': row.paid_date
            }
            invoicesArr.push(invoices)
        }

        return res.json({ company: {
                            code: result.rows[0].code,
                            name: result.rows[0].name,
                            description: result.rows[0].description,
                            invoices: invoicesArr
                            } 
                        });
    } catch(err) {
        return next(err)
    }
});

module.exports = router;
