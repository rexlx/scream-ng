package main

import (
	"crypto/tls"
	"flag"
	"log"
	"net/http"
)

var (
	fileName = flag.String("file", "Server.log", "Log file name")
	dbPath   = flag.String("db", "chat.db", "Database file name")

	certFile = flag.String("cert", "server-cert.pem", "Certificate file")
	keyFile  = flag.String("key", "server-key.pem", "Key file")
	addr     = flag.String("addr", ":8080", "Address to listen on")
	adminKey = flag.String("admin", "admin", "Admin key")
	// caFile   = flag.String("ca", "ca.pem", "CA file")
)

func main() {
	flag.Parse()

	cfg := &tls.Config{
		MinVersion:               tls.VersionTLS12,
		PreferServerCipherSuites: true,
		CurvePreferences: []tls.CurveID{
			tls.CurveP521,
			tls.CurveP384,
			tls.CurveP256,
		},
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,

			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
		},
	}
	cert, err := tls.LoadX509KeyPair(*certFile, *keyFile)
	if err != nil {
		log.Fatal(err)
	}
	cfg.Certificates = []tls.Certificate{cert}

	s := NewServer(*fileName, *dbPath, *adminKey)
	server := &http.Server{
		Addr:      *addr,
		Handler:   s.Gateway,
		TLSConfig: cfg,
	}

	s.Logger.Println("Server is running")
	log.Fatal(server.ListenAndServeTLS("", ""))
}
