package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/mailchamp/api/internal/auth"
	"github.com/mailchamp/api/internal/handlers"
)

func JWT(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				writeJSONError(w, http.StatusUnauthorized, "missing authorization")
				return
			}
			userID, err := auth.ParseUserID(header, secret)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, "invalid token")
				return
			}
			ctx := handlers.WithUserID(r.Context(), userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromRequest(r *http.Request) string {
	return handlers.UserIDFromContext(r.Context())
}

func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic: %v\n%s", rec, debug.Stack())
				writeJSONError(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// NoCORS intentionally omits Access-Control-Allow-Origin so browsers cannot
// call the API directly; Next.js server proxy is the only client path.
func NoCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSONError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(`{"error":"` + msg + `"}`))
}
