/**
 * ChaCha Chatbot Widget
 * Bu script, ChaCha chatbot'unu herhangi bir web sitesine entegre etmek için kullanılır.
 */
// dotenv konfigürasyonu
// Client-side JavaScript'te require() kullanılamaz
// Environment variables'ları backend'den almalı veya doğrudan tanımlamalıyız
// const SITE_URL = window.SITE_URL || 'http://localhost';
// const PORT = window.PORT || '3000';

(function () {
  // Widget CSS'ini dinamik olarak yükle
  function createWidgetStyles() {
    // Eğer widget.css zaten yüklenmişse tekrar yükleme
    if (document.querySelector('link[href*="widget.css"]')) {
      return;
    }

    // Widget CSS dosyasını yükle
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/css/widget.css`;
    document.head.appendChild(link);
  }

  // Widget HTML'ini oluştur
  function createWidgetHTML() {
    return `
        <div class="chacha-widget">
            <button id="chachaToggle" class="chat-toggle">
                <i class="fas fa-comment"></i>
            </button>

            <div class="chat-container collapsed">
                <div class="chat-header">
                    <div style="display: flex; align-items: center;">
                        <img src="/img/my-profile-img.jpg" alt="Assistant" class="header-avatar">
                        <h3>ChaCha[Çaça]</h3>
                    </div>
                    <div class="header-actions">
                        <button id="chachaClearChat" class="btn-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <button id="chachaMinimizeChat" class="btn-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="chachaMessages">
                    <!-- Messages will be added here -->
                </div>
                <div class="chat-input">
                    <form id="chachaForm" style="display: flex; flex-direction: column; gap: 8px;">
                        <div class="input-container">
                            <textarea 
                                id="chachaMessageInput" 
                                placeholder="Type your message..." 
                                rows="1"
                                required
                            ></textarea>
                            <button type="submit" class="send-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        `;
  }

  // Font Awesome'ı ekle
  function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }

  // Widget'ı başlat
  function initWidget() {
    // Stil ve Font Awesome'ı ekle
    createWidgetStyles();
    loadFontAwesome();

    // Widget HTML'ini ekle
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = createWidgetHTML();
    document.body.appendChild(widgetContainer);

    // DOM elementlerini seç
    const chatForm = document.getElementById('chachaForm');
    const messageInput = document.getElementById('chachaMessageInput');
    const chatMessages = document.getElementById('chachaMessages');
    const clearChatBtn = document.getElementById('chachaClearChat');
    const chatToggle = document.getElementById('chachaToggle');
    const minimizeChat = document.getElementById('chachaMinimizeChat');
    const chatContainer = document.querySelector('.chacha-widget .chat-container');

    // Mobil cihaz kontrolü
    const isMobile = window.matchMedia('(max-width: 480px)').matches;

    // Initialize conversationId as null (no longer using localStorage)
    let conversationId = null;

    // ObjectId formatını kontrol eden yardımcı fonksiyon
    function isValidObjectId(id) {
      // MongoDB ObjectId formatı: 24 karakterlik hexadecimal
      return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    }

    // Textarea otomatik boyutlandırma
    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });

    // Hoşgeldin mesajı ekle (since we're not loading from localStorage)
    addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');

    // Konuşma geçmişini yükleme fonksiyonu
    async function loadConversationHistory(id) {
      try {
        // ID formatını kontrol et
        if (!isValidObjectId(id)) {
          console.error('Geçersiz conversation ID formatı:', id);
          // Hoşgeldin mesajı ekle
          addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
          return;
        }

        // Yükleniyor mesajı ekle
        const loadingMessage = addLoadingMessage();

        // Konuşma geçmişini API'den al
        const response = await fetch(`/api/conversations/${id}/messages`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Yükleniyor mesajını kaldır
          loadingMessage.remove();
          
          // Mesajları ekle
          if (data && data.messages && data.messages.length > 0) {
            chatMessages.innerHTML = ''; // Mevcut mesajları temizle
            
            data.messages.forEach((msg) => {
              const sender = msg.role === 'user' ? 'user' : 'bot';
              addMessage(msg.content, sender);
            });
            
            // Otomatik scroll
            chatMessages.scrollTo({
              top: chatMessages.scrollHeight,
              behavior: 'smooth',
            });
          } else {
            // Mesaj yoksa hoşgeldin mesajı ekle
            addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
          }
        } else {
          // Hata durumunda yeni bir conversation başlat
          loadingMessage.remove();
          conversationId = null;
          addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        // Hata durumunda yeni bir conversation başlat
        conversationId = null;
        chatMessages.innerHTML = '';
        addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
      }
    }

    // Chat toggle işlemi
    chatToggle.addEventListener('click', () => {
      chatContainer.classList.toggle('collapsed');

      // Mobil cihazda chat açıkken body scroll'u engelle
      if (isMobile && !chatContainer.classList.contains('collapsed')) {
        document.body.style.overflow = 'hidden';
      } else if (isMobile) {
        document.body.style.overflow = '';
      }
    });

    // Minimize işlemi
    minimizeChat.addEventListener('click', () => {
      chatContainer.classList.add('collapsed');

      // Mobil cihazda chat kapalıyken body scroll'u etkinleştir
      if (isMobile) {
        document.body.style.overflow = '';
      }
    });

    // Chat temizleme işlemi
    clearChatBtn.addEventListener('click', () => {
      if (confirm('Sohbeti temizlemek istediğinize emin misiniz?')) {
        chatMessages.innerHTML = '';
        addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');

        // Conversation ID'yi sıfırla
        conversationId = null;
      }
    });

    // Form gönderme işlemi
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (!message) return;

      // Kullanıcı mesajını ekle
      addMessage(message, 'user');
      messageInput.value = '';
      messageInput.style.height = 'auto';

      // Yükleniyor mesajı ekle
      const loadingMessage = addLoadingMessage();

      try {
        // API'ye istek gönder
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationId,
          }),
        });

        // Yükleniyor mesajını kaldır
        loadingMessage.remove();

        if (response.ok) {
          const data = await response.json();
          
          // Yanıtı ekle
          if (data.response) {
            addMessage(data.response, 'bot', true);
          } else if (data.data && data.data.message) {
            addMessage(data.data.message, 'bot', true);
          } else if (data.message) {
            addMessage(data.message, 'bot', true);
          } else {
            addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
          }

          // Conversation ID'yi sakla (but don't store in localStorage)
          if (data.conversationId) {
            conversationId = data.conversationId;
          }
        } else {
          addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
        }
      } catch (error) {
        console.error('Error:', error);
        // Yükleniyor mesajını kaldır
        loadingMessage.remove();
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
      }
    });

    // Mesaj ekleme fonksiyonu
    function addMessage(content, sender, isHTML = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}`;

      // Avatar ekle
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';

      if (sender === 'bot') {
        const avatarImg = document.createElement('img');
        avatarImg.src = `/img/my-profile-img.jpg`;
        avatarImg.alt = 'Bot Avatar';
        avatarDiv.appendChild(avatarImg);
      } else {
        // Kullanıcı avatarı
        const userIcon = document.createElement('i');
        userIcon.className = 'fa fa-user';
        userIcon.style.fontSize = '20px';
        userIcon.style.color = '#fff';
        avatarDiv.style.background = '#2563EB';
        avatarDiv.style.display = 'flex';
        avatarDiv.style.alignItems = 'center';
        avatarDiv.style.justifyContent = 'center';
        avatarDiv.appendChild(userIcon);
      }

      messageDiv.appendChild(avatarDiv);

      // Mesaj içerik wrapper'ı oluştur
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';

      // Mesaj içeriği oluştur
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';

      // HTML içeriği kontrolü
      if (
        isHTML ||
        (sender === 'bot' &&
          (content.trim().startsWith('<div') || content.trim().startsWith('<p') || content.trim().startsWith('<span')))
      ) {
        // HTML içeriği güvenli bir şekilde ekle
        messageContent.innerHTML = content;
      } else {
        // Normal metin içeriği
        messageContent.textContent = content;
      }

      // Zaman damgası oluştur
      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = 'Şimdi';

      // İçerik ve zaman damgasını wrapper'a ekle
      contentWrapper.appendChild(messageContent);
      contentWrapper.appendChild(timestamp);

      // Wrapper'ı mesaj div'ine ekle
      messageDiv.appendChild(contentWrapper);

      chatMessages.appendChild(messageDiv);

      // Yumuşak animasyonla aşağı kaydır
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth',
      });

      return messageDiv;
    }

    // Yükleniyor mesajı ekleme fonksiyonu
    function addLoadingMessage() {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot';

      // Avatar ekle
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      const avatarImg = document.createElement('img');
      avatarImg.src = `/img/my-profile-img.jpg`;
      avatarImg.alt = 'Bot Avatar';
      avatarDiv.appendChild(avatarImg);
      messageDiv.appendChild(avatarDiv);

      // Mesaj içerik wrapper'ı oluştur
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';

      // Mesaj içeriği oluştur
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';

      const loadingDots = document.createElement('div');
      loadingDots.className = 'loading-dots';
      loadingDots.innerHTML = '<span></span><span></span><span></span>';

      messageContent.appendChild(loadingDots);
      contentWrapper.appendChild(messageContent);
      messageDiv.appendChild(contentWrapper);

      chatMessages.appendChild(messageDiv);

      // Yumuşak animasyonla aşağı kaydır
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth',
      });

      return messageDiv;
    }

    // Pencere boyutu değişikliği ve yön değişikliği işleme
    window.addEventListener('resize', () => {
      const isMobileNow = window.matchMedia('(max-width: 480px)').matches;
      
      // Mobil cihazda chat açıkken scroll'u engelle
      if (isMobileNow && !chatContainer.classList.contains('collapsed')) {
        document.body.style.overflow = 'hidden';
      } else if (isMobileNow) {
        document.body.style.overflow = '';
      }
    });
    
    // Enter tuşu ile mesaj gönderme
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Sayfa yüklendiğinde widget'ı başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
