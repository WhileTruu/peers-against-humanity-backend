#!/bin/bash

export CONNECTION_STRING='postgres://user:password@localhost:5432/sah'
export NODE_ENV=development
knex seed:run --knexfile src/database/knexfile.js
