#!/bin/bash

export CONNECTION_STRING='postgres://user:password@localhost:5432/sah'
export NODE_ENV=development
knex migrate:latest --knexfile src/database/knexfile.js
