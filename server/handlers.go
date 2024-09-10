package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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
	var m WSMessage
	// var m Message

	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		fmt.Println(err, "could not parse message")
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	// fmt.Printf("message handler %+v", m)
	if m.UserID == "" || m.RoomID == "" {
		fmt.Print("missing id")
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	formattedTime := time.Now()
	s.Messagechan <- WSMessage{
		InitialVector: m.InitialVector,
		Hotsauce:      m.Hotsauce,
		Time:          formattedTime.Format("01/02 15:04"),
		Message:       m.Message,
		UserID:        m.UserID,
		Email:         m.Email,
		RoomID:        m.RoomID,
		ReplyTo:       m.ReplyTo,
	}
	// fmt.Println("message received", m)
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

type UserPostRequest struct {
	Email   string `json:"email"`
	Content string `json:"content"`
}

func (s *Server) AddPostHandler(w http.ResponseWriter, r *http.Request) {
	// fmt.Println("add post handler")
	var upr UserPostRequest
	err := json.NewDecoder(r.Body).Decode(&upr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	if upr.Email == "" || upr.Content == "" {
		http.Error(w, "missing email or content", http.StatusBadRequest)
		return
	}
	u, err := s.GetUserByEmail(upr.Email)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	u.updatePosts(upr.Content)
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	out, err := json.Marshal(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
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

func (s *Server) TempKeyHandler(w http.ResponseWriter, r *http.Request) {
	// fmt.Println("temp key handler")
	var k Key
	k.Expires = time.Now().Add(time.Minute * 5)
	k.Value = uuid.New().String()
	k.Issued = time.Now()
	s.addKey(k)
	out, err := json.Marshal(k)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

func (s *Server) RoomHandler(w http.ResponseWriter, r *http.Request) {
	var rr RoomRequest
	err := json.NewDecoder(r.Body).Decode(&rr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	// fmt.Println("room handler", rr)
	if rr.Name == "" {
		http.Error(w, "missing name", http.StatusBadRequest)
		return
	}
	u, err := s.GetUserByEmail(rr.UserEmail)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	room := NewRoom("welcome", 100)

	room.ID = "welcome"
	s.Memory.Lock()
	for _, v := range s.Rooms {
		if v.Name == rr.Name {
			room = v
			break
		}
	}
	if room.ID == "welcome" {
		s.Logger.Printf("creating new room %v", rr.Name)
		room = NewRoom(rr.Name, 100)
		id := uuid.New().String()
		room.ID = id
		// s.Memory.Lock()
		s.Rooms[id] = room
		// s.Memory.Unlock()
	}
	u.updateHistory(room.Name)
	s.Memory.Unlock()
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	// res := make(map[string]string)
	// res["roomid"] = room.ID
	out, err := json.Marshal(room)
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
	// fmt.Println("add user handler")
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
	var lr UserRequest
	err := json.NewDecoder(r.Body).Decode(&lr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	// fmt.Println("login handler", lr)
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
		res := make(map[string]interface{})
		res["error"] = true
		res["message"] = "that password is so wrong"
		out, err := json.Marshal(res)
		if err != nil {
			fmt.Println("could not marshal response in login handler")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(out)
		return
	}
	if !ok {
		http.Error(w, "password does not match", http.StatusUnauthorized)
		return
	}
	u.updateHandle()
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	u.Password = ""
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

func (s *Server) AddRoomHandler(w http.ResponseWriter, r *http.Request) {
	// fmt.Println("add room handler")
	var rr RoomRequest
	err := json.NewDecoder(r.Body).Decode(&rr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	if rr.Name == "" {
		http.Error(w, "missing name", http.StatusBadRequest)
		return
	}
	u, err := s.GetUserByEmail(rr.UserEmail)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	u.updateRooms(rr.Name)
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

type historyRequest struct {
	UserID string `json:"user_id"`
}

func (s *Server) HistoryByIDHandler(w http.ResponseWriter, r *http.Request) {
	var hr historyRequest
	err := json.NewDecoder(r.Body).Decode(&hr)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	// fmt.Println("history by id handler", hr)
	u, err := s.GetUserByEmail(hr.UserID)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	res := make(map[string][]string)
	res["history"] = u.History
	// fmt.Println("history by id handler", res, u)
	out, err := json.Marshal(res)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

type ProfileUpdateRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	About     string `json:"about"`
}

func (s *Server) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	var pur ProfileUpdateRequest
	err := json.NewDecoder(r.Body).Decode(&pur)
	if err != nil {
		http.Error(w, "could not parse message", http.StatusBadRequest)
		return
	}
	fmt.Println("update user profile", pur)
	u, err := s.GetUserByEmail(pur.Email)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	u.FirstName = pur.FirstName
	u.LastName = pur.LastName
	u.About = pur.About
	u.updateHandle()
	err = s.AddUser(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	out, err := json.Marshal(u)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}
