package main

import (
	"flag"
	"log"
	"net/http"
)

var (
	fileName = flag.String("file", "Server.log", "Log file name")
	dbPath   = flag.String("db", "chat.db", "Database file name")
)

func main() {
	flag.Parse()
	s := NewServer(*fileName, *dbPath)
	s.Logger.Println("Server is running")
	log.Fatal(http.ListenAndServe(":8080", s.Gateway))
}
