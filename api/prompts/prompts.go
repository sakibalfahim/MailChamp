package prompts

import (
	"embed"
	"fmt"
	"strings"
)

//go:embed *.md
var files embed.FS

func Render(strategy, intent string, facts []string, tone string) (string, error) {
	filename := strategy + ".md"
	data, err := files.ReadFile(filename)
	if err != nil {
		return "", fmt.Errorf("read prompt %s: %w", filename, err)
	}
	template := string(data)
	factsBlock := strings.Join(facts, "\n")
	if len(facts) > 0 {
		lines := make([]string, len(facts))
		for i, f := range facts {
			lines[i] = "- " + f
		}
		factsBlock = strings.Join(lines, "\n")
	}
	out := template
	out = strings.ReplaceAll(out, "{{INTENT}}", intent)
	out = strings.ReplaceAll(out, "{{FACTS}}", factsBlock)
	out = strings.ReplaceAll(out, "{{TONE}}", tone)
	return out, nil
}

func ExtractEmail(raw, strategy string) string {
	if strategy == "advanced" {
		lower := strings.ToLower(raw)
		startTag := "<email>"
		endTag := "</email>"
		start := strings.Index(lower, startTag)
		if start >= 0 {
			start += len(startTag)
			end := strings.Index(lower[start:], endTag)
			if end >= 0 {
				return strings.TrimSpace(raw[start : start+end])
			}
		}
	}
	return strings.TrimSpace(raw)
}

func ParseSubjectBody(emailText string) (subject, bodyText, bodyHTML string) {
	lines := strings.Split(emailText, "\n")
	bodyStart := 0
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if len(trimmed) >= 8 && strings.EqualFold(trimmed[:8], "subject:") {
			subject = strings.TrimSpace(trimmed[8:])
			bodyStart = i + 1
			break
		}
	}
	for bodyStart < len(lines) && strings.TrimSpace(lines[bodyStart]) == "" {
		bodyStart++
	}
	bodyText = strings.TrimSpace(strings.Join(lines[bodyStart:], "\n"))
	bodyHTML = TextToHTML(bodyText)
	return subject, bodyText, bodyHTML
}

func TextToHTML(text string) string {
	if text == "" {
		return ""
	}
	parts := strings.Split(text, "\n\n")
	var b strings.Builder
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		b.WriteString("<p>")
		for i, line := range strings.Split(p, "\n") {
			if i > 0 {
				b.WriteString("<br>")
			}
			b.WriteString(escapeHTML(line))
		}
		b.WriteString("</p>")
	}
	return b.String()
}

func escapeHTML(s string) string {
	replacer := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&#39;",
	)
	return replacer.Replace(s)
}
