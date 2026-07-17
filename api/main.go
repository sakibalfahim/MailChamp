package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"

	"github.com/mailchamp/api/internal/config"
	"github.com/mailchamp/api/internal/db"
	"github.com/mailchamp/api/internal/gemini"
	"github.com/mailchamp/api/internal/handlers"
	"github.com/mailchamp/api/internal/middleware"
	"github.com/mailchamp/api/internal/ratelimit"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("MAILCHAMP_JWT_SECRET is required")
	}
	if len(cfg.JWTSecret) < 32 {
		log.Fatal("MAILCHAMP_JWT_SECRET must be at least 32 bytes")
	}
	if cfg.GeminiAPIKey == "" {
		log.Fatal("GEMINI_API_KEY is required")
	}

	store, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer store.Close()

	gem := gemini.New(
		cfg.GeminiAPIKey,
		cfg.GeminiModel,
		cfg.GeminiFallbacks,
		cfg.GeminiTemperature,
		cfg.GeminiMaxRetries,
		cfg.GeminiRequestDelaySecs,
	)
	defer gem.Close()

	emailHandler := handlers.EmailHandler{Store: store, Gemini: gem}
	limiter := ratelimit.New()

	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(middleware.NoCORS)

	r.Get("/api/v1/health", handlers.HealthHandler{
		DBPing: func() error {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			return store.Ping(ctx)
		},
	}.ServeHTTP)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.JWT(cfg.JWTSecret))

		r.With(ratelimit.Middleware(limiter, middleware.UserIDFromRequest)).Post("/emails/generate", emailHandler.Generate)
		r.Get("/emails", emailHandler.List)
		r.Get("/emails/{id}", emailHandler.Get)
		r.Post("/emails", emailHandler.Create)
		r.Patch("/emails/{id}", emailHandler.Patch)
		r.Delete("/emails/{id}", emailHandler.Delete)
	})

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       90 * time.Second,
		WriteTimeout:      90 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("Starting MailChamp API on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func init() {
	if os.Getenv("PORT") == "" {
		_ = os.Setenv("PORT", "8080")
	}
}
