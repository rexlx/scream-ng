#!/bin/bash

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "rxlx@nullferatu.com", "password": "mtllab"}' \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/adduser
