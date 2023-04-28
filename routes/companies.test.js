process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testComp;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
        ['apple', 'Apple Computer', 'Maker of OSX']
    );
    testComp = result.rows[0]
});

afterEach(async () => {
    await db.query(
        `DELETE FROM companies`
    );
});

afterAll(async () => {
    await db.end();
})

describe("GET /companies", () => {
    test("Get all companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [{ 
                                        code: testComp.code, 
                                        name: testComp.name 
                                    }]
                                });
    });
});

describe("GET /companies/:code", () => {
    test("Get company by code", async () => {
        const res = await request(app).get(`/companies/${testComp.code}`);
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: testComp })
    });
});

describe("POST /companies", () => {
    test("Creates a new company", async () => {
        const req = {
            code: 'ibm',
            name: 'IBM',
            description: 'Big blue'
        }
        const res = await request(app).post(`/companies`).send(req);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ company: req });
    });
});

describe("PUT /companies/:code", () => {
    test("Update a single company", async () => {
        const req = {
            name: `${testComp.name}`,
            description: 'A digital apple orchard'
        }

        const res = await request(app).put(`/companies/${testComp.code}`).send(req);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ company: {
                                        code: `${testComp.code}`,
                                        name: `${testComp.name}`,
                                        description: 'A digital apple orchard'
                                    }
                                });
    });
  
    test("Responds with 404 if can't find company", async () => {
      const res = await request(app).put(`/companies/opple`);
      expect(res.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a single a company", async () => {
        const res = await request(app).delete(`/companies/${testComp.code}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: "deleted" });
    });
});

