#!/bin/sh
# Follow this tutorial https://www.stereolabs.com/docs/docker/building-arm-container-on-x86/
docker build --platform linux/arm64/v8 -t armexperiment .  
docker run --rm -it --platform linux/arm64/v8 --volume=$HOME/projects/beats/:/beats armexperiment  /bin/bash -i
