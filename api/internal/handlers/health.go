package handlers

import (
	"encoding/json"
	"net/http"
)

type HealthHandler struct {
	DBPing func() error
}

func (h HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	status := "ok"
	code := http.StatusOK
	if h.DBPing != nil {
		if err := h.DBPing(); err != nil {
			status = "degraded"
			code = http.StatusServiceUnavailable
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": status})
}
