#!/bin/bash

# ec:<(openssl ecparam -name secp521r1) # ECC521:w

openssl req -x509 -newkey rsa:4096 -nodes \
    -days 365 -keyout ca-key.pem -out ca-cert.pem \
    -subj \
    "/C=US/ST=TEXAS/L=WOODLANDS/O=DEV/OU=LOL/CN=chat.dreadco.fake/emailAddress=rxlx@dreadco.fake"

openssl req -newkey rsa:4096 -nodes \
    -keyout server-key.pem -out server-req.pem -subj \
    "/C=US/ST=TEXAS/L=WOODLANDS/O=DEV/OU=LOL/CN=chat.dreadco.fake/emailAddress=rxlx@dreadco.fake"

openssl x509 -req -in server-req.pem -CA ca-cert.pem \
    -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -extfile /Users/rxlx/bin/data/server-ext.conf

# client side
openssl req -newkey rsa:4096 -nodes \
    -keyout client-key.pem -out client-req.pem -subj \
    "/C=US/ST=TEXAS/L=WOODLANDS/O=DEV/OU=LOL/CN=chat.dreadco.us/emailAddress=rxlx@dreadco.fake"

openssl x509 -req -in client-req.pem \
    -days 360 -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out client-cert.pem

