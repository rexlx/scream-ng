package main

type Message struct {
	User      string `json:"user"`
	Email     string `json:"email"`
	UserID    string `json:"user_id"`
	RoomID    string `json:"room_id"`
	Value     string `json:"value"`
	Timestamp int64  `json:"timestamp"`
	ReplyTo   string `json:"reply_to"`
}
