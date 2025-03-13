# ChaCha Chatbot Widget

ChaCha Chatbot Widget, herhangi bir web sitesine kolayca entegre edilebilen, modern ve kullanıcı dostu bir sohbet arayüzüdür. Bu widget, kullanıcılarınızın web sitenizde gezinirken anında yardım alabilmelerini sağlar.

## Özellikler

- Responsive tasarım (mobil ve masaüstü uyumlu)
- Kolay entegrasyon
- Özelleştirilebilir renk şeması
- Otomatik boyutlanan metin alanı
- Yükleme animasyonları
- Temiz ve modern arayüz

## Kurulum

Widget'ı web sitenize entegre etmek için aşağıdaki adımları izleyin:

1. `widget.js` dosyasını web sunucunuza yükleyin
2. Aşağıdaki kodu HTML sayfanızın `</body>` etiketinden hemen önce ekleyin:

```html
<script src="yol/widget.js"></script>
```

## Özelleştirme

### Renk Şeması

Widget'ın renk şemasını değiştirmek için `widget.js` dosyasındaki CSS değişkenlerini düzenleyebilirsiniz:

```css
:root {
    --primary-color: #0F1923;
    --secondary-color: #0A1428;
    --accent-color: #2563EB;
    --background-color: #0F1923;
    --chat-bg: #0F1923;
    --chat-header-bg: #1A2634;
    --text-primary: #fff;
    --text-secondary: #4B5563;
    --user-message-bg: #2563EB;
    --bot-message-bg: #1A2634;
    --user-message-color: #fff;
    --bot-message-color: #fff;
    --input-bg: #0D1721;
    --input-border: #2A3644;
    --button-hover: #1D4ED8;
}
```

### Chatbot Adı ve Avatarı

Chatbot'un adını ve avatarını değiştirmek için `createWidgetHTML()` fonksiyonundaki ilgili kısımları düzenleyin:

```javascript
<div style="display: flex; align-items: center;">
    <img src="https://ui-avatars.com/api/?background=1A2634&color=fff&name=CC" alt="Assistant" class="header-avatar">
    <h3>ChaCha[Çaça]</h3>
</div>
```

### Hoşgeldin Mesajı

Hoşgeldin mesajını değiştirmek için `initWidget()` fonksiyonundaki şu satırı düzenleyin:

```javascript
// Hoşgeldin mesajı ekle
addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
```

### API Endpoint'i

Chatbot'un mesajları işleyeceği API endpoint'ini değiştirmek için `chatForm.addEventListener` içindeki fetch URL'sini düzenleyin:

```javascript
const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
});
```

## API Entegrasyonu

Widget, mesajları işlemek için bir API endpoint'ine ihtiyaç duyar. API'nizin aşağıdaki formatta yanıt vermesi gerekir:

```json
{
  "response": "Bot'un yanıtı burada olacak"
}
```

## Örnek Kullanım

Widget'ın nasıl göründüğünü ve çalıştığını görmek için `widget-example.html` dosyasını inceleyebilirsiniz.

## Tarayıcı Uyumluluğu

Widget aşağıdaki tarayıcılarla uyumludur:

- Chrome (son 2 sürüm)
- Firefox (son 2 sürüm)
- Safari (son 2 sürüm)
- Edge (son 2 sürüm)

## Lisans

MIT 