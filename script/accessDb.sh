#!/bin/bash

docker-compose  exec postgres sh -c 'psql -v --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"'