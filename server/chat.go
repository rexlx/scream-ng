package main

type Message struct {
	User    string `json:"user"`
	Email   string `json:"email"`
	UserID  string `json:"user_id"`
	RoomID  string `json:"room_id"`
	Message string `json:"message"`
	Time    int64  `json:"time"`
	ReplyTo string `json:"reply_to"`
}
