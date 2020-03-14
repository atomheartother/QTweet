#!/bin/env bash

if [ "$#" -ne 1 ]; then
    echo "Usage: backup.sh <backup folder>"
    exit 0
fi

/bin/env docker-compose exec postgres sh -c 'pg_dump $POSTGRES_DB --username "$POSTGRES_USER"' | /bin/env gzip > $1/dump_`date +%Y-%m-%d"_"%H_%M_%S`.sql.gz 2>>logs/import-error.log