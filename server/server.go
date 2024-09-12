package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"go.etcd.io/bbolt"
)

var (
	userBucket = "users"
)

type Server struct {
	*WSHandler
	ValidKeys map[string]*Key
	Stats     *Stats
	Rooms     map[string]*Room
	Memory    *sync.RWMutex
	Logger    *log.Logger
	Gateway   *http.ServeMux
	StartTime time.Time
	DB        *bbolt.DB
}

type Stats struct {
	App         map[string]float64   `json:"app"`
	Coordinates map[string][]float64 `json:"coordinates"`
	Graphs      map[string]string    `json:"graphs"`
	GraphCache  string               `json:"graph_cache"`
}

type Key struct {
	Value       string    `json:"value"`
	Expires     time.Time `json:"expires"`
	Issued      time.Time `json:"issued"`
	RequestedBy string    `json:"requested_by"`
}

func NewServer(fileHandle string, dbName string) *Server {
	rooms := make(map[string]*Room)
	keys := make(map[string]*Key)
	stats := &Stats{
		App:         make(map[string]float64),
		Coordinates: make(map[string][]float64),
		Graphs:      make(map[string]string),
	}
	wsh := &WSHandler{
		TTL:         30 * time.Hour,
		Stop:        make(chan struct{}),
		Memory:      &sync.RWMutex{},
		Messagechan: make(chan WSMessage, 1000),
	}

	fh, err := os.OpenFile(fileHandle, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal(err)
	}
	db, err := bbolt.Open(dbName, 0666, nil)
	if err != nil {
		log.Fatal(err)
	}
	s := &Server{
		ValidKeys: keys,
		DB:        db,
		Rooms:     rooms,
		WSHandler: wsh,
		Stats:     stats,
		Memory:    &sync.RWMutex{},
		Logger:    log.New(fh, "", log.LstdFlags),
		Gateway:   http.NewServeMux(),
		StartTime: time.Now(),
	}
	devRoom := NewRoom("welcome", 100)
	devRoom.ID = "welcome"
	s.Rooms["welcome"] = devRoom
	s.ValidKeys["undefined"] = &Key{
		Value:       "undefined",
		Expires:     time.Now().Add(time.Minute * 24),
		Issued:      time.Now(),
		RequestedBy: "system",
	}
	s.Gateway.Handle("/login", http.HandlerFunc(s.LoginHandler))
	s.Gateway.Handle("/addpost", s.ValidateToken(http.HandlerFunc(s.AddPostHandler)))
	s.Gateway.Handle("/addroom", s.ValidateToken(http.HandlerFunc(s.AddRoomHandler)))
	s.Gateway.Handle("/static/", http.StripPrefix("/static/", s.ServeStaticDirectory()))
	s.Gateway.Handle("/test", s.ValidateToken(http.HandlerFunc(s.TestHandler)))
	s.Gateway.Handle("/message", s.ValidateToken(http.HandlerFunc(s.MessageHandler)))
	s.Gateway.Handle("/adduser", s.ValidateToken(http.HandlerFunc(s.AddUserHandler)))
	s.Gateway.Handle("/getuser", s.ValidateToken(http.HandlerFunc(s.GetProfileHandler)))
	s.Gateway.Handle("/profile", s.ValidateToken(http.HandlerFunc(s.UpdateUserProfile)))
	s.Gateway.Handle("/history", s.ValidateToken(http.HandlerFunc(s.HistoryByIDHandler)))
	s.Gateway.Handle("/hotsauce", s.ValidateToken(http.HandlerFunc(s.TempKeyHandler)))
	s.Gateway.Handle("/room/", http.StripPrefix("/room", http.HandlerFunc(s.RoomHandler)))
	s.Gateway.Handle("/ws/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) < 4 {
			http.Error(w, "wont create new connection for that request", http.StatusNotFound)
			return
		}
		tk := parts[3]
		if !s.isValidKey(tk) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		s.ServeWS(s.Rooms, w, r)
	}))
	return s
}

func (s *Server) ValidateToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("validating token")
		token := r.Header.Get("Authorization")
		if token != "Bearer thisisadoggertoken" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func UnixToTime(unix int64) time.Time {
	return time.UnixMilli(unix)
}

func (s *Server) addKey(k Key) {
	s.Memory.Lock()
	defer s.Memory.Unlock()
	s.ValidKeys[k.Value] = &k

}

func (s *Server) isValidKey(key string) bool {
	s.Memory.RLock()
	defer s.Memory.RUnlock()
	k, ok := s.ValidKeys[key]
	if !ok {
		return false
	}
	if time.Since(k.Expires) > 0 {
		return false
	}
	fmt.Println("tkey is valid!")
	return true
}
