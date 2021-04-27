#!/bin/bash
#docker run -dti --env ID=$1 --env PORT=$1 --name Server$1 -p $1:$1 serverimagen
docker run --net=host -dti --env PORT=$1 --name Server$1  serverlab6