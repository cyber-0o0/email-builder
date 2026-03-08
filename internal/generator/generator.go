package generator

import (
	"fmt"
	"strings"
)

// EmailTemplate — структура email-письма
type EmailTemplate struct {
	Type      string      `json:"type"`      // ecommerce, saas, b2b, etc.
	Theme     Theme       `json:"theme"`     // Цветовая тема
	Blocks    []Block     `json:"blocks"`    // Блоки письма
	Preheader string      `json:"preheader"` // Текст прехедера
	Subject   string      `json:"subject"`   // Тема письма
}

// Theme — цветовая схема
type Theme struct {
	Primary   string `json:"primary"`   // Основной цвет
	Accent    string `json:"accent"`    // Акцентный цвет
	Background string `json:"background"` // Фон
	Text      string `json:"text"`      // Основной текст
}

// Block — блок письма
type Block struct {
	Type    string                 `json:"type"`    // header, hero, text, button, products, footer, etc.
	Data    map[string]interface{} `json:"data"`    // Данные блока
	Enabled bool                   `json:"enabled"` // Включён/выключен
}

// Generator — генератор HTML email
type Generator struct{}

// New — создать генератор
func New() *Generator {
	return &Generator{}
}

// Generate — сгенерировать HTML из структуры
func (g *Generator) Generate(t *EmailTemplate) (string, error) {
	var sb strings.Builder

	// Базовая структура
	sb.WriteString(g.baseTemplate(t))

	// Блоки
	for _, block := range t.Blocks {
		if !block.Enabled {
			continue
		}
		sb.WriteString(g.renderBlock(block, t))
	}

	// Footer
	sb.WriteString(g.footer())

	sb.WriteString("</table></td></tr></table></body></html>")

	return sb.String(), nil
}

// baseTemplate — базовый HTML-каркас
func (g *Generator) baseTemplate(t *EmailTemplate) string {
	bg := t.Theme.Background
	if bg == "" {
		bg = "#f0f0f0"
	}
	primary := t.Theme.Primary
	if primary == "" {
		primary = "#1a1a1a"
	}
	accent := t.Theme.Accent
	if accent == "" {
		accent = "#1e5cb5"
	}

	return fmt.Sprintf(`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>%s</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%%; -ms-text-size-adjust: 100%%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100%% !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: %s; font-family: Arial, Helvetica, sans-serif;">
    <div style="font-size: 0px; color: %s; visibility: hidden;">%s&nbsp;&nbsp;</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="background-color: %s;">
        <tr>
            <td align="center" valign="top" style="padding: 28px 15px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%%;">
`, t.Subject, bg, bg, t.Preheader, bg)
}

// renderBlock — рендер блока
func (g *Generator) renderBlock(block Block, t *EmailTemplate) string {
	switch block.Type {
	case "header":
		return g.header(block.Data)
	case "hero":
		return g.hero(block.Data, t)
	case "text":
		return g.textBlock(block.Data)
	case "button":
		return g.button(block.Data)
	case "products":
		return g.products(block.Data)
	case "social":
		return g.social(block.Data)
	case "footer":
		return g.customFooter(block.Data)
	case "divider":
		return g.divider(block.Data)
	default:
		return ""
	}
}

// header — шапка
func (g *Generator) header(data map[string]interface{}) string {
	logo := getString(data, "logo", "BRAND")
	link := getString(data, "link", "https://example.com")
	bg := getString(data, "background", "#0d1f3c")

	return fmt.Sprintf(`
<tr>
    <td align="left" valign="top" bgcolor="%s" style="background-color: %s; padding: 22px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
            <tr>
                <td align="left" valign="middle" style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 3px;">
                    %s
                </td>
                <td align="right" valign="middle">
                    <a href="%s" target="_blank" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #8baacb; text-decoration: none;">Перейти на сайт</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
`, bg, bg, logo, link)
}

// hero — главный блок
func (g *Generator) hero(data map[string]interface{}, t *EmailTemplate) string {
	title := getString(data, "title", "Заголовок")
	desc := getString(data, "description", "Описание")
	image := getString(data, "image", "")
	btnText := getString(data, "button_text", "Узнать больше")
	btnLink := getString(data, "button_link", "https://example.com")

	imgHTML := ""
	if image != "" {
		imgHTML = fmt.Sprintf(`<img src="%s" width="600" height="360" alt="%s" style="display: block; border: 0; width: 100%%; max-width: 600px; height: auto;">`, image, title)
	}

	return fmt.Sprintf(`
<tr>
    <td align="center" valign="top" bgcolor="#ffffff" style="background-color: #ffffff;">
        %s
    </td>
</tr>
<tr>
    <td align="center" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; padding: 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: bold; color: %s; line-height: 36px; padding-bottom: 16px;">
                    %s
                </td>
            </tr>
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #666666; line-height: 24px; padding-bottom: 24px;">
                    %s
                </td>
            </tr>
            <tr>
                <td align="center">
                    %s
                </td>
            </tr>
        </table>
    </td>
</tr>
`, imgHTML, t.Theme.Primary, title, desc, g.buttonHTML(btnText, btnLink, t.Theme.Accent))
}

// textBlock — текстовый блок
func (g *Generator) textBlock(data map[string]interface{}) string {
	title := getString(data, "title", "")
	content := getString(data, "content", "")

	var sb strings.Builder
	sb.WriteString(`<tr><td align="left" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; padding: 24px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">`)
	
	if title != "" {
		sb.WriteString(fmt.Sprintf(`<tr><td style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: bold; color: #1a1a1a; line-height: 26px; padding-bottom: 12px;">%s</td></tr>`, title))
	}
	
	sb.WriteString(fmt.Sprintf(`<tr><td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; line-height: 22px;">%s</td></tr></table></td></tr>`, content))
	
	return sb.String()
}

// button — кнопка
func (g *Generator) button(data map[string]interface{}) string {
	text := getString(data, "text", "Нажмите")
	link := getString(data, "link", "https://example.com")
	accent := getString(data, "accent", "#1e5cb5")

	return fmt.Sprintf(`
<tr>
    <td align="center" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; padding: 0 32px 32px;">
        %s
    </td>
</tr>
`, g.buttonHTML(text, link, accent))
}

// buttonHTML — HTML кнопки (bullet-proof)
func (g *Generator) buttonHTML(text, link, color string) string {
	return fmt.Sprintf(`<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="%s" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="4%%" strokecolor="%s" fillcolor="%s">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">%s</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="%s" target="_blank" style="display: inline-block; background-color: %s; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; line-height: 50px; text-align: center; text-decoration: none; width: 200px;">%s</a>
<!--<![endif]-->`, link, color, color, text, link, color, text)
}

// products — блок товаров
func (g *Generator) products(data map[string]interface{}) string {
	items, _ := data["items"].([]interface{})
	if len(items) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString(`<tr><td align="center" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; padding: 0 32px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%"><tr>`)

	for i, item := range items {
		if i > 0 {
			sb.WriteString(`<td style="width: 16px;">&nbsp;</td>`)
		}
		itemMap, _ := item.(map[string]interface{})
		sb.WriteString(g.productCard(itemMap))
	}

	sb.WriteString(`</tr></table></td></tr>`)
	return sb.String()
}

// productCard — карточка товара
func (g *Generator) productCard(data map[string]interface{}) string {
	name := getString(data, "name", "Товар")
	desc := getString(data, "description", "")
	price := getString(data, "price", "0 ₽")
	image := getString(data, "image", "")
	link := getString(data, "link", "https://example.com")

	imgHTML := ""
	if image != "" {
		imgHTML = fmt.Sprintf(`<img src="%s" width="260" height="180" alt="%s" style="display: block; border: 0; width: 100%%; max-width: 260px; height: auto;">`, image, name)
	}

	return fmt.Sprintf(`<td valign="top" width="260" style="width: 260px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="border: 1px solid #e0e0e0;">
        <tr>
            <td align="center" bgcolor="#f5f5f5" style="background-color: #f5f5f5;">
                %s
            </td>
        </tr>
        <tr>
            <td style="padding: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #1a1a1a; line-height: 20px;">
                %s
            </td>
        </tr>
        <tr>
            <td style="padding: 0 16px 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #808080; line-height: 18px;">
                %s
            </td>
        </tr>
        <tr>
            <td style="padding: 0 16px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; color: #e74c3c; line-height: 22px;">
                %s
            </td>
        </tr>
        <tr>
            <td style="padding: 0 16px 16px;">
                <a href="%s" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; color: #1e5cb5; text-decoration: underline;">Подробнее →</a>
            </td>
        </tr>
    </table>
</td>`, imgHTML, name, desc, price, link)
}

// divider — горизонтальный разделитель
func (g *Generator) divider(data map[string]interface{}) string {
	color := getString(data, "color", "#e0e0e0")
	height := getInt(data, "height", 1)
	
	return fmt.Sprintf(`
<tr>
    <td style="font-size: 0; height: %dpx; background-color: %s;" height="%d">&nbsp;</td>
</tr>`, height, color, height)
}

// footer — футер
func (g *Generator) footer() string {
	return `
<tr>
    <td align="center" valign="top" bgcolor="#1a1a2e" style="background-color: #1a1a2e; padding: 28px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #6a7a8a; line-height: 20px;">
                    ООО «Компания» — г. Москва<br>
                    <a href="tel:+74951234567" style="color: #8a9aaa; text-decoration: none;">+7 (495) 123-45-67</a>
                </td>
            </tr>
            <tr><td style="font-size: 0; height: 12px;">&nbsp;</td></tr>
            <tr><td style="font-size: 0; height: 1px; background-color: #2a2a3e;" height="1">&nbsp;</td></tr>
            <tr><td style="font-size: 0; height: 12px;">&nbsp;</td></tr>
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #4a5a6a; line-height: 18px;">
                    <a href="https://example.com/unsubscribe" style="color: #4a5a6a; text-decoration: underline;">Отписаться</a>
                    &nbsp;·&nbsp;
                    © 2026 Название компании
                </td>
            </tr>
        </table>
    </td>
</tr>
`
}

// customFooter — кастомный футер
func (g *Generator) customFooter(data map[string]interface{}) string {
	company := getString(data, "company", "ООО «Компания»")
	address := getString(data, "address", "г. Москва")
	phone := getString(data, "phone", "+7 (495) 123-45-67")
	email := getString(data, "email", "info@example.com")
	unsubscribe := getString(data, "unsubscribe", "https://example.com/unsubscribe")

	return fmt.Sprintf(`
<tr>
    <td align="center" valign="top" bgcolor="#1a1a2e" style="background-color: #1a1a2e; padding: 28px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #6a7a8a; line-height: 20px;">
                    %s — %s<br>
                    <a href="tel:%s" style="color: #8a9aaa; text-decoration: none;">%s</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:%s" style="color: #4f6ef7; text-decoration: none;">%s</a>
                </td>
            </tr>
            <tr><td style="font-size: 0; height: 12px;">&nbsp;</td></tr>
            <tr><td style="font-size: 0; height: 1px; background-color: #2a2a3e;" height="1">&nbsp;</td></tr>
            <tr><td style="font-size: 0; height: 12px;">&nbsp;</td></tr>
            <tr>
                <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #4a5a6a; line-height: 18px;">
                    <a href="%s" style="color: #4a5a6a; text-decoration: underline;">Отписаться</a>
                    &nbsp;·&nbsp;
                    © 2026 %s
                </td>
            </tr>
        </table>
    </td>
</tr>
`, company, address, phone, phone, email, email, unsubscribe, company)
}

// social — блок соцсетей
func (g *Generator) social(data map[string]interface{}) string {
	networks, _ := data["networks"].([]interface{})
	if len(networks) == 0 {
		// Дефолтные соцсети
		networks = []interface{}{
			map[string]interface{}{"type": "telegram", "link": "https://t.me/example"},
			map[string]interface{}{"type": "vk", "link": "https://vk.com/example"},
			map[string]interface{}{"type": "instagram", "link": "https://instagram.com/example"},
		}
	}

	var icons strings.Builder
	icons.WriteString(`<tr><td align="center" style="padding: 16px 0;">`)

	for _, n := range networks {
		network, _ := n.(map[string]interface{})
		networkType := getString(network, "type", "telegram")
		link := getString(network, "link", "https://example.com")

		var iconURL, alt string
		switch networkType {
		case "telegram":
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg"
			alt = "Telegram"
		case "vk":
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/vk.svg"
			alt = "ВКонтакте"
		case "instagram":
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg"
			alt = "Instagram"
		case "whatsapp":
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg"
			alt = "WhatsApp"
		case "youtube":
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg"
			alt = "YouTube"
		default:
			iconURL = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/link.svg"
			alt = networkType
		}

		icons.WriteString(fmt.Sprintf(`<a href="%s" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="%s" width="32" height="32" alt="%s" style="display: block; border: 0; width: 32px; height: 32px;"></a>`, link, iconURL, alt))
	}

	icons.WriteString(`</td></tr>`)
	return icons.String()
}

// getString — получить строку из map
func getString(data map[string]interface{}, key, def string) string {
	if val, ok := data[key]; ok {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return def
}

// getInt — получить int из map
func getInt(data map[string]interface{}, key string, def int) int {
	if val, ok := data[key]; ok {
		if n, ok := val.(float64); ok {
			return int(n)
		}
	}
	return def
}
