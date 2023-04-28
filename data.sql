DROP DATABASE IF EXISTS biztime;

CREATE DATABASE biztime;

\c biztime

DROP TABLE IF EXISTS company_industry;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.'),
         ('venmo', 'Venmo', 'Fintech services'),
         ('stryker', 'Stryker', 'Makes medical equipment'),
         ('ge', 'General Electric', 'Makes electrical appliances');

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null),
         ('ibm', 500, true, '2019-02-01'),
         ('venmo', 600, false, null),
         ('venmo', 700, true, '2020-03-01'),
         ('stryker', 800, false, null),
         ('stryker', 900, true, '2021-04-01'),
         ('ge', 1000, false, null),
         ('ge', 1100, true, '2022-05-01');

CREATE TABLE industries (
    id serial PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL UNIQUE
);

INSERT INTO industries (code, name)
  VALUES ('tech', 'Teachnology'),
         ('fin', 'Finance'),
         ('med', 'Medical');

CREATE TABLE company_industry (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    ind_code text NOT NULL REFERENCES industries(code) ON DELETE CASCADE
);

INSERT INTO company_industry (comp_code, ind_code)
  VALUES ('apple', 'tech'),
         ('ibm', 'tech'),
         ('venmo', 'fin'),
         ('venmo', 'tech'),
         ('stryker', 'med'),
         ('stryker', 'tech'),
         ('ge', 'med'),
         ('ge', 'tech');
