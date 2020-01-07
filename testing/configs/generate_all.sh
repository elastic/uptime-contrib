#!/bin/sh -ex
./generate.py 100 > 100-monitors.yml
./generate.py 300 > 300-monitors.yml
./generate.py 1000 > 1000-monitors.yml
./generate.py 10000 > 10000-monitors.yml
./generate.py 50000 > 50000-monitors.yml
