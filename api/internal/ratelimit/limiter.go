package ratelimit

import (
	"net/http"
	"sync"
	"time"
)

const generateLimit = 10

type bucket struct {
	count  int
	window time.Time
}

type Limiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
}

func New() *Limiter {
	return &Limiter{buckets: make(map[string]*bucket)}
}

func (l *Limiter) Allow(userID string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	for id, b := range l.buckets {
		if now.Sub(b.window) >= 2*time.Minute {
			delete(l.buckets, id)
		}
	}
	b, ok := l.buckets[userID]
	if !ok || now.Sub(b.window) >= time.Minute {
		l.buckets[userID] = &bucket{count: 1, window: now}
		return true
	}
	if b.count >= generateLimit {
		return false
	}
	b.count++
	return true
}

func Middleware(l *Limiter, userIDFromRequest func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := userIDFromRequest(r)
			if userID == "" || !l.Allow(userID) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error":"rate limit exceeded: 10 generate requests per minute"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
