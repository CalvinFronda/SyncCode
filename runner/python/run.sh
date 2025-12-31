#!/bin/sh
set -e


echo "$CODE" > program.py
timeout 5s python program.py

