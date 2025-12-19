#!/bin/sh
set -e

echo "$CODE" > program.py

# Run with timeout
timeout 5s python program.py
