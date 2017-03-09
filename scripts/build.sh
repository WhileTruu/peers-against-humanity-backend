#!/bin/bash

export NODE_ENV=production
babel src/ -d build --source-maps
