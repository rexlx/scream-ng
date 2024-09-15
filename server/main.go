package main

import (
	"flag"
	"log"
	"net/http"
)

var (
	fileName = flag.String("file", "Server.log", "Log file name")
	dbPath   = flag.String("db", "chat.db", "Database file name")
	keyName  = flag.String("key", "heftymonieshiddeninjelly", "Key file name")
)

func main() {
	flag.Parse()
	s := NewServer(*fileName, *dbPath, *keyName)
	s.Logger.Println("Server is running")
	log.Fatal(http.ListenAndServe(":8080", s.Gateway))
}
