package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

func (s *Server) ServeStaticDirectory() http.Handler {
	return http.FileServer(http.Dir("./static"))
}

func (s *Server) TestHandler(w http.ResponseWriter, r *http.Request) {
	out := make(map[string]string)
	out["midnight"] = "train"
	res, err := json.Marshal(out)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func (s *Server) MessageHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("message handler")
	var m Message
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		fmt.Println(err, "could not parse message")
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	if m.UserID == "" || m.RoomID == "" {
		fmt.Print("missing id")
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	formattedTime := UnixToTime(m.Timestamp)
	s.Messagechan <- WSMessage{
		Time:    formattedTime.Format("01/02 15:04"),
		Message: m.Value,
		UserID:  m.UserID,
		Email:   m.User,
		RoomID:  m.RoomID,
		ReplyTo: m.ReplyTo,
	}
	fmt.Println("message received", m)
	res := make(map[string]string)
	w.Header().Set("Content-Type", "application/json")
	res["ok"] = "true"
	out, err := json.Marshal(res)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Write(out)
}

func (s *Server) MessageHistoryHandler(w http.ResponseWriter, r *http.Request) {
	type historyRequest struct {
		RoomID string `json:"room_id"`
		UserID string `json:"user_id"`
	}
	var hr historyRequest
	err := json.NewDecoder(r.Body).Decode(&hr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	room, ok := s.Rooms[hr.RoomID]
	if !ok {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}
	room.Memory.RLock()
	defer room.Memory.RUnlock()
	var messages []WSMessage
	messages = append(messages, room.Messages...)

	res := make(map[string][]WSMessage)
	res["messages"] = messages
	out, err := json.Marshal(res)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

type RoomRequest struct {
	UserEmail string `json:"email"`
	Name      string `json:"name"`
	Regular   bool   `json:"regular"`
}

func (s *Server) RoomHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("room handler")
	// var e bool
	var rr RoomRequest
	err := json.NewDecoder(r.Body).Decode(&rr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	// defer func(roomName string, err bool) {
	// 	if err {
	// 		fmt.Println("error creating room", roomName)
	// 	} else {
	// 		fmt.Println("room created", roomName)
	// 	}
	// }(rr.Name, e)
	if rr.Name == "" {
		http.Error(w, "missing name", http.StatusBadRequest)
		return
	}
	u, err := s.GetUserByEmail(rr.UserEmail)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	room, ok := s.Rooms[rr.Name]
	if !ok {
		s.Logger.Printf("creating new room %v", rr.Name)
		room = NewRoom(rr.Name, 100)
		id := uuid.New().String()
		room.ID = id
		s.Memory.Lock()
		s.Rooms[id] = room
		s.Memory.Unlock()
	}
	u.updateHistory(room.Name)
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	res := make(map[string]string)
	res["roomid"] = room.ID
	out, err := json.Marshal(res)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

type UserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) AddUserHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("add user handler")
	var nu UserRequest
	err := json.NewDecoder(r.Body).Decode(&nu)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	if nu.Email == "" || nu.Password == "" {
		http.Error(w, "missing email or password", http.StatusBadRequest)
		return
	}
	u := User{}
	err = u.CreateUser(nu.Email, nu.Password)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	res := make(map[string]string)
	res["ok"] = "true"
	out, err := json.Marshal(res)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

func (s *Server) LoginHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("login handler")
	var lr UserRequest
	err := json.NewDecoder(r.Body).Decode(&lr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	if lr.Email == "" || lr.Password == "" {
		http.Error(w, "missing email or password", http.StatusBadRequest)
		return
	}
	u, err := s.GetUserByEmail(lr.Email)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	ok, err := u.PasswordMatches(lr.Password)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if !ok {
		http.Error(w, "password does not match", http.StatusUnauthorized)
		return
	}
	u.updateHandle()

	out, err := json.Marshal(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
	s.Memory.Lock()
	s.Stats.App["logins"]++
	s.Memory.Unlock()
}

// func (s *Server) ServeDir()
