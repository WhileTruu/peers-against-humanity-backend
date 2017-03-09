#!/bin/bash

export SECRET='yolohorsebatterystable'
export CONNECTION_STRING='postgres://user:password@localhost:5432/sah'
export NODE_ENV=production
export PORT=8080
node build
