> logs/access.log
rm -r task/*
docker rm -f $(docker container ls -aq)
docker run --net=host -dti --env PORT=3001 --name Server3001  server
docker run --net=host -dti --env PORT=3002 --name Server3002  server
docker run --net=host -dti --env PORT=3003 --name Server3003  server