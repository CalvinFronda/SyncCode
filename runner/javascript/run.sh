#!/bin/sh
set -e

echo "$CODE" > program.js
timeout 5s node program.js
