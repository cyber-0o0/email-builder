package main

import (
	"log"
	"net/http"

	"email-builder/internal/api"
	"email-builder/internal/generator"
	"email-builder/internal/storage"
)

func main() {
	// Инициализация компонентов
	store := storage.New("./storage")
	gen := generator.New()
	
	// Роуты
	apiHandler := api.New(gen, store)
	
	http.HandleFunc("/api/generate", apiHandler.Generate)
	http.HandleFunc("/api/ai-generate", apiHandler.AIGenerate)
	http.HandleFunc("/api/upload", apiHandler.Upload)
	http.HandleFunc("/storage/", apiHandler.ServeImage)
	
	// Статика для фронтенда
	http.Handle("/", http.FileServer(http.Dir("./web")))

	log.Println("Email Builder запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
