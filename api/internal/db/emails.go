package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Email struct {
	ID        uuid.UUID `json:"id"`
	UserID    string    `json:"user_id"`
	Status    string    `json:"status"`
	Subject   string    `json:"subject"`
	BodyHTML  string    `json:"body_html"`
	BodyText  string    `json:"body_text"`
	Intent    *string   `json:"intent,omitempty"`
	KeyFacts  []string  `json:"key_facts"`
	Tone      *string   `json:"tone,omitempty"`
	Strategy  *string   `json:"strategy,omitempty"`
	ToAddress *string   `json:"to_address,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Store struct {
	pool *pgxpool.Pool
}

func New(databaseURL string) (*Store, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 5
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, err
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) Ping(ctx context.Context) error {
	return s.pool.Ping(ctx)
}

func (s *Store) ListEmails(ctx context.Context, userID, status string) ([]Email, error) {
	var rows pgx.Rows
	var err error

	switch status {
	case "", "all":
		rows, err = s.pool.Query(ctx, `
			SELECT id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address, created_at, updated_at
			FROM emails
			WHERE user_id = $1 AND status IN ('draft','sent')
			ORDER BY updated_at DESC
		`, userID)
	default:
		rows, err = s.pool.Query(ctx, `
			SELECT id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address, created_at, updated_at
			FROM emails
			WHERE user_id = $1 AND status = $2
			ORDER BY updated_at DESC
		`, userID, status)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanEmails(rows)
}

func (s *Store) GetEmail(ctx context.Context, userID string, id uuid.UUID) (Email, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address, created_at, updated_at
		FROM emails WHERE id = $1 AND user_id = $2
	`, id, userID)
	return scanEmail(row)
}

func (s *Store) CreateEmail(ctx context.Context, userID string, e Email) (Email, error) {
	factsJSON, err := json.Marshal(e.KeyFacts)
	if err != nil {
		return Email{}, err
	}
	id := uuid.New()
	row := s.pool.QueryRow(ctx, `
		INSERT INTO emails (id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address, created_at, updated_at
	`, id, userID, e.Status, e.Subject, e.BodyHTML, e.BodyText, e.Intent, factsJSON, e.Tone, e.Strategy, e.ToAddress)
	return scanEmail(row)
}

type EmailPatch struct {
	Status    *string
	Subject   *string
	BodyHTML  *string
	BodyText  *string
	Intent    *string
	KeyFacts  []string
	Tone      *string
	Strategy  *string
	ToAddress *string
	SetFacts  bool
}

func (s *Store) UpdateEmail(ctx context.Context, userID string, id uuid.UUID, p EmailPatch) (Email, error) {
	current, err := s.GetEmail(ctx, userID, id)
	if err != nil {
		return Email{}, err
	}
	if p.Status != nil {
		current.Status = *p.Status
	}
	if p.Subject != nil {
		current.Subject = *p.Subject
	}
	if p.BodyHTML != nil {
		current.BodyHTML = *p.BodyHTML
	}
	if p.BodyText != nil {
		current.BodyText = *p.BodyText
	}
	if p.Intent != nil {
		current.Intent = p.Intent
	}
	if p.SetFacts {
		current.KeyFacts = p.KeyFacts
	}
	if p.Tone != nil {
		current.Tone = p.Tone
	}
	if p.Strategy != nil {
		current.Strategy = p.Strategy
	}
	if p.ToAddress != nil {
		current.ToAddress = p.ToAddress
	}
	factsJSON, err := json.Marshal(current.KeyFacts)
	if err != nil {
		return Email{}, err
	}
	row := s.pool.QueryRow(ctx, `
		UPDATE emails SET
			status = $3, subject = $4, body_html = $5, body_text = $6,
			intent = $7, key_facts = $8, tone = $9, strategy = $10, to_address = $11,
			updated_at = now()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, status, subject, body_html, body_text, intent, key_facts, tone, strategy, to_address, created_at, updated_at
	`, id, userID, current.Status, current.Subject, current.BodyHTML, current.BodyText,
		current.Intent, factsJSON, current.Tone, current.Strategy, current.ToAddress)
	return scanEmail(row)
}

func (s *Store) DeleteEmail(ctx context.Context, userID string, id uuid.UUID) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM emails WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func scanEmails(rows pgx.Rows) ([]Email, error) {
	var out []Email
	for rows.Next() {
		e, err := scanEmailRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func scanEmail(row pgx.Row) (Email, error) {
	return scanEmailRow(row)
}

type scannable interface {
	Scan(dest ...any) error
}

func scanEmailRow(row scannable) (Email, error) {
	var e Email
	var factsJSON []byte
	err := row.Scan(
		&e.ID, &e.UserID, &e.Status, &e.Subject, &e.BodyHTML, &e.BodyText,
		&e.Intent, &factsJSON, &e.Tone, &e.Strategy, &e.ToAddress, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return Email{}, err
	}
	if len(factsJSON) > 0 {
		if err := json.Unmarshal(factsJSON, &e.KeyFacts); err != nil {
			return Email{}, fmt.Errorf("decode key_facts: %w", err)
		}
	}
	if e.KeyFacts == nil {
		e.KeyFacts = []string{}
	}
	return e, nil
}

