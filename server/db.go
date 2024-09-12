package main

import (
	"fmt"
	"time"

	"go.etcd.io/bbolt"
)

func (s *Server) GetUserByEmail(email string) (User, error) {
	s.Memory.Lock()
	defer s.Memory.Unlock()
	s.Stats.App["user_queries"]++
	var user User
	err := s.DB.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(userBucket))
		v := b.Get([]byte(email))
		if v == nil {
			fmt.Println("GetUserByEmail: user not found")
			s.Stats.App["user_not_found"]++
			return nil
		}

		return user.UnmarshalBinary(v)
	})
	return user, err
}

func (s *Server) GetUserByID(id string) (User, error) {
	s.Memory.Lock()
	defer s.Memory.Unlock()
	s.Stats.App["user_queries"]++
	var user User
	err := s.DB.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(userBucket))
		c := b.Cursor()
		for k, v := c.First(); k != nil; k, v = c.Next() {
			err := user.UnmarshalBinary(v)
			if err != nil {
				return err
			}
			if user.ID == id {
				return nil
			}
		}
		fmt.Println("GetUserByID: user not found")
		s.Stats.App["user_not_found"]++
		return nil
	})
	return user, err
}

func (s *Server) AddUser(u User) error {
	u.UpdatedAt = time.Now()
	s.Memory.Lock()
	defer s.Memory.Unlock()
	s.Stats.App["user_saves"]++
	return s.DB.Update(func(tx *bbolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(userBucket))
		if err != nil {
			return err
		}
		v, err := u.MarshalBinary()
		if err != nil {
			return err
		}
		return b.Put([]byte(u.Email), v)
	})
}

func (s *Server) AddRoom(r *Room) {
	s.Memory.Lock()
	defer s.Memory.Unlock()
	s.Stats.App["new_rooms"]++
	s.Rooms[r.ID] = r
}
