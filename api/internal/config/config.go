package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL            string
	GeminiAPIKey           string
	JWTSecret              string
	Port                   string
	GeminiModel            string
	GeminiFallbacks        []string
	GeminiTemperature      float64
	GeminiMaxRetries       int
	GeminiRequestDelaySecs int
}

func Load() Config {
	fallbacks := strings.Split(getEnv("GEMINI_FALLBACKS", "gemini-3.1-flash-lite-preview"), ",")
	clean := make([]string, 0, len(fallbacks))
	for _, f := range fallbacks {
		f = strings.TrimSpace(f)
		if f != "" {
			clean = append(clean, f)
		}
	}

	temp, _ := strconv.ParseFloat(getEnv("GEMINI_TEMPERATURE", "0.4"), 64)
	retries, _ := strconv.Atoi(getEnv("GEMINI_MAX_RETRIES", "6"))
	delay, _ := strconv.Atoi(getEnv("GEMINI_REQUEST_DELAY_SECONDS", "15"))

	return Config{
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		GeminiAPIKey:           os.Getenv("GEMINI_API_KEY"),
		JWTSecret:              os.Getenv("MAILCHAMP_JWT_SECRET"),
		Port:                   getEnv("PORT", "8080"),
		GeminiModel:            getEnv("GEMINI_MODEL", "gemini-3-flash-preview"),
		GeminiFallbacks:        clean,
		GeminiTemperature:      temp,
		GeminiMaxRetries:       retries,
		GeminiRequestDelaySecs: delay,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
