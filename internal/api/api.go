package api

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"email-builder/internal/generator"
	"email-builder/internal/storage"
)

// API — API хендлеры
type API struct {
	gen     *generator.Generator
	storage *storage.Storage
}

// New — создать API
func New(gen *generator.Generator, store *storage.Storage) *API {
	return &API{
		gen:     gen,
		storage: store,
	}
}

// GenerateRequest — запрос на генерацию
type GenerateRequest struct {
	Type      string               `json:"type"`
	Theme     generator.Theme     `json:"theme"`
	Blocks    []generator.Block   `json:"blocks"`
	Preheader string              `json:"preheader"`
	Subject   string              `json:"subject"`
}

// GenerateResponse — ответ генерации
type GenerateResponse struct {
	HTML string `json:"html"`
	ID   string `json:"id"`
}

// Generate — сгенерировать email из JSON
func (a *API) Generate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Установка значений по умолчанию
	if req.Type == "" {
		req.Type = "ecommerce"
	}
	if req.Subject == "" {
		req.Subject = "Email от компании"
	}
	if req.Preheader == "" {
		req.Preheader = "Узнайте больше о наших предложениях"
	}

	// Генерация
	email := &generator.EmailTemplate{
		Type:      req.Type,
		Theme:     req.Theme,
		Blocks:    req.Blocks,
		Preheader: req.Preheader,
		Subject:   req.Subject,
	}

	html, err := a.gen.Generate(email)
	if err != nil {
		http.Error(w, fmt.Sprintf("Generation error: %v", err), http.StatusInternalServerError)
		return
	}

	// Генерация ID
	id := generateID()

	resp := GenerateResponse{
		HTML: html,
		ID:   id,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// AIGenerate — AI-генерация (заглушка - будет интеграция с LLM)
func (a *API) AIGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Prompt string `json:"prompt"`
		Type   string `json:"type"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Заглушка - позже будет AI
	// Пока возвращаем базовый шаблон
	email := &generator.EmailTemplate{
		Type:      req.Type,
		Subject:   "Новости от компании",
		Preheader: "Узнайте больше в этом письме",
		Theme: generator.Theme{
			Primary:   "#1a1a1a",
			Accent:    "#1e5cb5",
			Background: "#f0f0f0",
		},
		Blocks: []generator.Block{
			{
				Type: "header",
				Data: map[string]interface{}{
					"logo": "BRAND",
				},
				Enabled: true,
			},
			{
				Type: "hero",
				Data: map[string]interface{}{
					"title":       "Добро пожаловать!",
					"description": req.Prompt,
					"button_text": "Узнать больше",
				},
				Enabled: true,
			},
		},
	}

	html, err := a.gen.Generate(email)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	id := generateID()
	json.NewEncoder(w).Encode(GenerateResponse{HTML: html, ID: id})
}

// Upload — загрузить картинку
func (a *API) Upload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Максимум 5MB
	r.Body = http.MaxBytesReader(w, r.Body, 5*1024*1024)

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}

	url, err := a.storage.Upload(header.Filename, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"url": url,
	})
}

// ServeImage — отдать картинку
func (a *API) ServeImage(w http.ResponseWriter, r *http.Request) {
	a.storage.ServeHTTP(w, r)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

// generateID — генерация ID
func generateID() string {
	return "email_" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[randIntn(len(letters))]
	}
	return string(b)
}

func randIntn(n int) int {
	return rand.Intn(n)
}
