#!/bin/bash
> logs/access.log
rm -r task/*
docker build -t server .
docker rm -f $(docker container ls -aq)
for i in {1..3}; do
  docker run --net=host -dti --env PORT=300$i --name Server300$i  server
done