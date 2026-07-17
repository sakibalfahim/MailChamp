package gemini

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type Client struct {
	apiKey      string
	model       string
	fallbacks   []string
	temperature float32
	maxRetries  int
	delay       time.Duration

	mu     sync.Mutex
	client *genai.Client
}

func New(apiKey, model string, fallbacks []string, temperature float64, maxRetries, delaySecs int) *Client {
	if maxRetries < 0 {
		maxRetries = 0
	}
	return &Client{
		apiKey:      apiKey,
		model:       model,
		fallbacks:   fallbacks,
		temperature: float32(temperature),
		maxRetries:  maxRetries,
		delay:       time.Duration(delaySecs) * time.Second,
	}
}

func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.client != nil {
		_ = c.client.Close()
		c.client = nil
	}
}

func (c *Client) getClient(ctx context.Context) (*genai.Client, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.client != nil {
		return c.client, nil
	}
	client, err := genai.NewClient(ctx, option.WithAPIKey(c.apiKey))
	if err != nil {
		return nil, err
	}
	c.client = client
	return client, nil
}

func (c *Client) Generate(ctx context.Context, prompt string) (string, string, error) {
	models := append([]string{c.model}, c.fallbacks...)
	var lastErr error

	for _, modelName := range models {
		for attempt := 0; attempt <= c.maxRetries; attempt++ {
			if attempt > 0 {
				select {
				case <-ctx.Done():
					return "", modelName, ctx.Err()
				case <-time.After(c.delay):
				}
			}
			text, err := c.call(ctx, modelName, prompt)
			if err == nil {
				return text, modelName, nil
			}
			lastErr = err
			if !isRetryable(err) {
				break
			}
		}
	}
	return "", c.model, fmt.Errorf("gemini generate failed: %w", lastErr)
}

func (c *Client) call(ctx context.Context, modelName, prompt string) (string, error) {
	client, err := c.getClient(ctx)
	if err != nil {
		return "", err
	}

	model := client.GenerativeModel(modelName)
	model.SetTemperature(c.temperature)
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}
	if resp == nil || len(resp.Candidates) == 0 {
		return "", fmt.Errorf("empty response from %s", modelName)
	}
	var parts []string
	for _, part := range resp.Candidates[0].Content.Parts {
		if t, ok := part.(genai.Text); ok {
			parts = append(parts, string(t))
		}
	}
	text := strings.TrimSpace(strings.Join(parts, ""))
	if text == "" {
		return "", fmt.Errorf("empty text from %s", modelName)
	}
	return text, nil
}

func isRetryable(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "429") ||
		strings.Contains(msg, "quota") ||
		strings.Contains(msg, "rate") ||
		strings.Contains(msg, "503") ||
		strings.Contains(msg, "500") ||
		strings.Contains(msg, "timeout") ||
		strings.Contains(msg, "unavailable")
}
