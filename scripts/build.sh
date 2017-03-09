#!/bin/bash

export NODE_ENV=production
babel src/ -d dist --source-maps
