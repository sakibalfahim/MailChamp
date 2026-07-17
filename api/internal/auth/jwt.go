package auth

import (
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	jwt.RegisteredClaims
}

func ParseUserID(tokenString, secret string) (string, error) {
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	token, err := parser.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}
	if claims.Subject == "" {
		return "", fmt.Errorf("missing subject")
	}
	return claims.Subject, nil
}
