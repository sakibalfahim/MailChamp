package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/mailchamp/api/internal/db"
	"github.com/mailchamp/api/internal/gemini"
	"github.com/mailchamp/api/prompts"
)

const maxBodyBytes = 1 << 20 // 1 MiB
const generateTimeout = 85 * time.Second

type EmailHandler struct {
	Store  *db.Store
	Gemini *gemini.Client
}

type generateRequest struct {
	Intent   string   `json:"intent"`
	KeyFacts []string `json:"key_facts"`
	Tone     string   `json:"tone"`
	Strategy string   `json:"strategy"`
}

type generateResponse struct {
	Subject   string `json:"subject"`
	BodyText  string `json:"body_text"`
	BodyHTML  string `json:"body_html"`
	ModelUsed string `json:"model_used,omitempty"`
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) || errors.Is(err, io.ErrUnexpectedEOF) {
			writeError(w, http.StatusRequestEntityTooLarge, "request body too large")
			return false
		}
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}

func validStrategy(s *string) bool {
	if s == nil {
		return true
	}
	return *s == "advanced" || *s == "naive"
}

func (h EmailHandler) Generate(w http.ResponseWriter, r *http.Request) {
	var req generateRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	req.Intent = strings.TrimSpace(req.Intent)
	req.Tone = strings.TrimSpace(req.Tone)
	req.Strategy = strings.TrimSpace(req.Strategy)
	if req.Intent == "" || req.Tone == "" {
		writeError(w, http.StatusBadRequest, "intent and tone are required")
		return
	}
	if req.Strategy == "" {
		req.Strategy = "advanced"
	}
	if req.Strategy != "advanced" && req.Strategy != "naive" {
		writeError(w, http.StatusBadRequest, "strategy must be advanced or naive")
		return
	}

	prompt, err := prompts.Render(req.Strategy, req.Intent, req.KeyFacts, req.Tone)
	if err != nil {
		log.Printf("prompt render: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), generateTimeout)
	defer cancel()

	raw, modelUsed, err := h.Gemini.Generate(ctx, prompt)
	if err != nil {
		log.Printf("gemini generate: %v", err)
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			writeError(w, http.StatusGatewayTimeout, "generation timed out")
			return
		}
		writeError(w, http.StatusBadGateway, "generation failed")
		return
	}

	emailText := prompts.ExtractEmail(raw, req.Strategy)
	subject, bodyText, bodyHTML := prompts.ParseSubjectBody(emailText)

	writeJSON(w, http.StatusOK, generateResponse{
		Subject:   subject,
		BodyText:  bodyText,
		BodyHTML:  bodyHTML,
		ModelUsed: modelUsed,
	})
}

func (h EmailHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r.Context())
	status := r.URL.Query().Get("status")
	switch status {
	case "", "all", "draft", "sent", "archived":
	default:
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}
	emails, err := h.Store.ListEmails(r.Context(), userID, status)
	if err != nil {
		log.Printf("list emails: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if emails == nil {
		emails = []db.Email{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"emails": emails})
}

func (h EmailHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid email id")
		return
	}
	email, err := h.Store.GetEmail(r.Context(), userID, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "email not found")
			return
		}
		log.Printf("get email: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, email)
}

type createEmailRequest struct {
	Subject   string   `json:"subject"`
	BodyHTML  string   `json:"body_html"`
	BodyText  string   `json:"body_text"`
	Intent    *string  `json:"intent"`
	KeyFacts  []string `json:"key_facts"`
	Tone      *string  `json:"tone"`
	Strategy  *string  `json:"strategy"`
	ToAddress *string  `json:"to_address"`
	Status    string   `json:"status"`
}

func (h EmailHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r.Context())
	var req createEmailRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	status := req.Status
	if status == "" {
		status = "draft"
	}
	if status != "draft" && status != "sent" && status != "archived" {
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}
	if !validStrategy(req.Strategy) {
		writeError(w, http.StatusBadRequest, "strategy must be advanced or naive")
		return
	}
	if req.KeyFacts == nil {
		req.KeyFacts = []string{}
	}
	email, err := h.Store.CreateEmail(r.Context(), userID, db.Email{
		Status:    status,
		Subject:   req.Subject,
		BodyHTML:  req.BodyHTML,
		BodyText:  req.BodyText,
		Intent:    req.Intent,
		KeyFacts:  req.KeyFacts,
		Tone:      req.Tone,
		Strategy:  req.Strategy,
		ToAddress: req.ToAddress,
	})
	if err != nil {
		log.Printf("create email: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, email)
}

type patchEmailRequest struct {
	Subject   *string  `json:"subject"`
	BodyHTML  *string  `json:"body_html"`
	BodyText  *string  `json:"body_text"`
	Intent    *string  `json:"intent"`
	KeyFacts  []string `json:"key_facts"`
	Tone      *string  `json:"tone"`
	Strategy  *string  `json:"strategy"`
	ToAddress *string  `json:"to_address"`
	Status    *string  `json:"status"`
}

func (h EmailHandler) Patch(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid email id")
		return
	}
	var req patchEmailRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Status != nil {
		s := *req.Status
		if s != "draft" && s != "sent" && s != "archived" {
			writeError(w, http.StatusBadRequest, "invalid status")
			return
		}
	}
	if !validStrategy(req.Strategy) {
		writeError(w, http.StatusBadRequest, "strategy must be advanced or naive")
		return
	}
	patch := db.EmailPatch{
		Status:    req.Status,
		Subject:   req.Subject,
		BodyHTML:  req.BodyHTML,
		BodyText:  req.BodyText,
		Intent:    req.Intent,
		Tone:      req.Tone,
		Strategy:  req.Strategy,
		ToAddress: req.ToAddress,
	}
	if req.KeyFacts != nil {
		patch.KeyFacts = req.KeyFacts
		patch.SetFacts = true
	}

	email, err := h.Store.UpdateEmail(r.Context(), userID, id, patch)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "email not found")
			return
		}
		log.Printf("patch email: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, email)
}

func (h EmailHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid email id")
		return
	}
	if err := h.Store.DeleteEmail(r.Context(), userID, id); err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "email not found")
			return
		}
		log.Printf("delete email: %v", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

type ctxKey string

const userIDKey ctxKey = "userID"

func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(userIDKey).(string)
	return v
}

func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}
