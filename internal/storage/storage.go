package storage

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	MaxFileSize    = 5 * 1024 * 1024  // 5MB
	MaxStorageSize = 100 * 1024 * 1024 // 100MB
)

var AllowedExtensions = []string{".jpg", ".jpeg", ".png", ".gif"}

// Storage — S3-like хранилище
type Storage struct {
	basePath string
	baseURL  string
}

// New — создать хранилище
func New(basePath string) *Storage {
	// Создать папку если нет
	os.MkdirAll(basePath, 0755)
	
	return &Storage{
		basePath: basePath,
		baseURL:  "/storage",
	}
}

// Upload — загрузить файл
func (s *Storage) Upload(filename string, data []byte) (string, error) {
	// Проверка размера
	if len(data) > MaxFileSize {
		return "", fmt.Errorf("файл слишком большой (макс 5MB)")
	}

	// Проверка расширения
	ext := strings.ToLower(filepath.Ext(filename))
	allowed := false
	for _, e := range AllowedExtensions {
		if ext == e {
			allowed = true
			break
		}
	}
	if !allowed {
		return "", fmt.Errorf("неподдерживаемый формат. Разрешены: jpg, png, gif")
	}

	// Генерация уникального имени
	uniqueName := s.generateUniqueName(ext)
	filePath := filepath.Join(s.basePath, uniqueName)

	// Запись файла
	err := os.WriteFile(filePath, data, 0644)
	if err != nil {
		return "", fmt.Errorf("ошибка записи: %v", err)
	}

	return s.baseURL + "/" + uniqueName, nil
}

// Get — получить файл
func (s *Storage) Get(key string) ([]byte, string, error) {
	filePath := filepath.Join(s.basePath, key)
	
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, "", err
	}

	ext := strings.ToLower(filepath.Ext(key))
	contentType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".gif":
		contentType = "image/gif"
	}

	return data, contentType, nil
}

// Delete — удалить файл
func (s *Storage) Delete(key string) error {
	filePath := filepath.Join(s.basePath, key)
	return os.Remove(filePath)
}

// ServeHTTP — обработать HTTP запрос
func (s *Storage) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimPrefix(r.URL.Path, "/storage/")
	
	switch r.Method {
	case http.MethodGet:
		data, contentType, err := s.Get(key)
		if err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", contentType)
		w.Write(data)
		
	case http.MethodDelete:
		err := s.Delete(key)
		if err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// generateUniqueName — сгенерировать уникальное имя
func (s *Storage) generateUniqueName(ext string) string {
	rand.Seed(time.Now().UnixNano())
	
	letters := "abcdefghijklmnopqrstuvwxyz"
	randStr := make([]byte, 12)
	for i := range randStr {
		randStr[i] = letters[rand.Intn(len(letters))]
	}
	
	timestamp := time.Now().Format("20060102150405")
	return fmt.Sprintf("%s_%s%s", string(randStr), timestamp, ext)
}

// ReadFile — прочитать файл из multipart
func (s *Storage) ReadFile(file *io.Reader) ([]byte, error) {
	return io.ReadAll(*file)
}
