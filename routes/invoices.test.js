process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testComp;
let testInvoice;

beforeEach(async () => {
    let comp = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
        ['apple', 'Apple Computer', 'Maker of OSX']
    );
    testComp = comp.rows[0]

    const result = await db.query(
        `INSERT INTO invoices (comp_Code, amt, paid, paid_date)
            VALUES ($1, $2, $3, $4)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        ['apple', 1000, false, null]
    );
    testInvoice = result.rows[0]
});

afterEach(async () => {
    await db.query(
        `DELETE FROM companies`
    );
    await db.query(
        `DELETE FROM invoices`
    );
});

afterAll(async () => {
    await db.end();
})

describe("GET /invoices", () => {
    test("Get all invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoices: [{ 
                                        id: testInvoice.id, 
                                        comp_code: testInvoice.comp_code 
                                    }]
                                });
    });
});

describe("GET /invoices/:id", () => {
    test("Get invoice by id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoice: {
                                        id: testInvoice.id,
                                        amt: testInvoice.amt,
                                        paid: testInvoice.paid,
                                        add_date: JSON.parse(JSON.stringify(testInvoice.add_date)),
                                        company: {
                                            code: testComp.code,
                                            name: testComp.name,
                                            description: testComp.description,
                                        }
                                    }
                                });
    });
});

describe("POST /invoices", () => {
    test("Creates a new invoice", async () => {
        const req = {
            comp_code: 'apple',
            amt: 100
        }
        const res = await request(app).post(`/invoices`).send(req);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ invoice: {
                                        id: expect.any(Number),
                                        comp_code: req.comp_code,
                                        amt: req.amt,
                                        paid: false,
                                        add_date: expect.any(String),
                                        paid_date: null
                                    } 
                                });
    });
});

describe("PUT /invoices/:id", () => {
    test("Update a single invoice amount", async () => {
        const req = {
            amt: 100,
        }

        const res = await request(app).put(`/invoices/${testInvoice.id}`).send(req);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ invoice: {
                                        id: expect.any(Number),
                                        comp_code: 'apple',
                                        amt: 100,
                                        paid: false,
                                        add_date: expect.any(String),
                                        paid_date: null
                                    }
                                });
    });
    test("Responds with 404 if can't find invoice", async () => {
        const res = await request(app).put(`/invoices/1000`);
        expect(res.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes a single a invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: "deleted" });
    });
});

describe("GET /invoices/companies/:code", () => {
    test("Get all invoices for a specific company", async () => {
        const res = await request(app).get(`/invoices/companies/${testComp.code}`);
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: {
                                        code: "apple",
                                        name: "Apple Computer",
                                        description: "Maker of OSX",
                                        invoices: [
                                            {
                                                id: expect.any(Number),
                                                comp_code: testInvoice.comp_code,
                                                amt: testInvoice.amt,
                                                paid: false,
                                                add_date: expect.any(String),
                                                paid_date: null
                                            }
                                        ]}
                                });
    });
});