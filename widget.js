/**
 * ChaCha Chatbot Widget
 * Bu script, ChaCha chatbot'unu herhangi bir web sitesine entegre etmek için kullanılır.
 */
// dotenv konfigürasyonu
// Client-side JavaScript'te require() kullanılamaz
// Environment variables'ları backend'den almalı veya doğrudan tanımlamalıyız
const SITE_URL = window.SITE_URL || 'http://localhost'; 
const PORT = window.PORT || '3000';


(function() {
    // Widget CSS'ini dinamik olarak oluştur
    function createWidgetStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
        :root {
            --primary-color: #0F1923;
            --secondary-color: #0A1428;
            --accent-color: #2563EB;
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
        
        .chacha-widget * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .chacha-widget .chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--bot-message-bg);
            color: var(--text-primary);
            border: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            cursor: pointer;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            transition: transform 0.3s ease;
        }
        
        .chacha-widget .chat-toggle:hover {
            transform: scale(1.1);
        }
        
        .chacha-widget .chat-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 700px;
            background: var(--chat-bg);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid var(--input-border);
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 9999;
        }
        
        .chacha-widget .chat-container.collapsed {
            transform: translateX(400px);
            opacity: 0;
            pointer-events: none;
        }
        
        .chacha-widget .chat-header {
            padding: 16px;
            background: var(--chat-header-bg);
            color: var(--text-primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--input-border);
        }
        
        .chacha-widget .chat-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .chacha-widget .header-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 12px;
        }
        
        .chacha-widget .header-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .chacha-widget .header-actions .btn-link {
            padding: 0.5rem;
            font-size: 1.1rem;
            transition: opacity 0.2s;
            color: white;
            display: flex;
            background: none;
            border: none;
            cursor: pointer;
        }
        
        .chacha-widget .header-actions .btn-link:hover {
            opacity: 0.8;
        }
        
        .chacha-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background-color: var(--chat-bg);
        }
        
        .chacha-widget .message {
            max-width: 80%;
            display: flex;
            gap: 12px;
            animation: fadeIn 0.3s ease-out;
        }
        
        .chacha-widget .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }
        
        .chacha-widget .message.bot {
            align-self: flex-start;
        }
        
        .chacha-widget .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }
        
        .chacha-widget .message-avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .chacha-widget .message-content-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .chacha-widget .message-content {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13.5px;
            line-height: 1.4;
        }
        
        .chacha-widget .user .message-content {
            background-color: var(--user-message-bg);
            color: var(--user-message-color);
            border-bottom-right-radius: 4px;
        }
        
        .chacha-widget .bot .message-content {
            background-color: var(--bot-message-bg);
            color: var(--bot-message-color);
            border-bottom-left-radius: 4px;
        }
        
        .chacha-widget .timestamp {
            font-size: 0.75rem;
            opacity: 0.7;
            color: var(--text-primary);
            margin: 0 4px;
        }
        
        .chacha-widget .chat-input {
            padding: 16px;
            background-color: var(--chat-header-bg);
        }
        
        .chacha-widget .input-container {
            display: flex;
            gap: 12px;
            align-items: flex-end;
            width: 100%;
        }
        
        .chacha-widget textarea {
            flex: 1;
            background-color: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 8px;
            padding: 12px;
            color: var(--text-primary);
            font-size: 0.95rem;
            resize: none;
            max-height: 120px;
            min-height: 44px;
        }
        
        .chacha-widget textarea:focus {
            outline: none;
            border-color: var(--accent-color);
        }
        
        .chacha-widget textarea::placeholder {
            color: var(--text-secondary);
        }
        
        .chacha-widget .send-button {
            background-color: var(--accent-color);
            color: var(--text-primary);
            border: none;
            border-radius: 8px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .chacha-widget .send-button:hover {
            background-color: var(--button-hover);
        }
        
        .chacha-widget .loading-dots {
            display: flex;
            justify-content: center;
            gap: 4px;
        }
        
        .chacha-widget .loading-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--text-primary);
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .chacha-widget .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .chacha-widget .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .chacha-widget ::-webkit-scrollbar {
            width: 6px;
        }
        
        .chacha-widget ::-webkit-scrollbar-track {
            background: var(--chat-bg);
        }
        
        .chacha-widget ::-webkit-scrollbar-thumb {
            background: var(--input-border);
            border-radius: 3px;
        }
        
        .chacha-widget ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
        
        @media (max-width: 480px) {
            .chacha-widget .chat-container {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0;
                border-radius: 0;
            }
            
            .chacha-widget .chat-container.collapsed {
                transform: translateY(100%);
            }
            
            .chacha-widget .message {
                max-width: 90%;
            }
            
            .chacha-widget .chat-toggle {
                bottom: 20px;
                right: 20px;
            }
        }
        `;
        return styleElement;
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
                        <img src="${SITE_URL}:${PORT}/img/my-profile-img.jpg" alt="Assistant" class="header-avatar">
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
        document.head.appendChild(createWidgetStyles());
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

        // Conversation ID'yi localStorage'dan al veya null olarak başlat
        let conversationId = localStorage.getItem('chachaConversationId');

        // Textarea otomatik boyutlandırma
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Eğer önceki bir conversationId varsa, konuşma geçmişini yükle
        if (conversationId) {
            loadConversationHistory(conversationId);
        } else {
            // Hoşgeldin mesajı ekle
            addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
        }

        // Konuşma geçmişini yükleme fonksiyonu
        async function loadConversationHistory(id) {
            try {
                // Yükleniyor mesajı ekle
                const loadingMessage = addLoadingMessage();
                
                // Konuşma mesajlarını API'den al
                const response = await fetch(`${SITE_URL}:${PORT}/api/conversations/${id}/messages`);
                
                if (response.ok) {
                    const messages = await response.json();
                    
                    // Yükleniyor mesajını kaldır
                    loadingMessage.remove();
                    
                    // Chat ekranını temizle
                    chatMessages.innerHTML = '';
                    
                    // Mesajları ekrana ekle
                    if (messages.length > 0) {
                        // Her bir mesajı ekle
                        for (const msg of messages) {
                            // API'den gelen role değerini widget'ın beklediği formata dönüştür
                            // API'de 'assistant' olarak geliyor, widget'ta 'bot' olarak kullanılıyor
                            const senderType = msg.role === 'assistant' ? 'bot' : 'user';
                            
                            // Mesajı ekle
                            const messageDiv = document.createElement('div');
                            messageDiv.className = `message ${senderType}`;
                            
                            // Avatar ekle
                            const avatarDiv = document.createElement('div');
                            avatarDiv.className = 'message-avatar';
                            
                            if (senderType === 'bot') {
                                const avatarImg = document.createElement('img');
                                avatarImg.src = `${SITE_URL}:${PORT}/img/my-profile-img.jpg`;
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
                            if (senderType === 'bot' && (msg.content.trim().startsWith('<div') || msg.content.trim().startsWith('<p') || msg.content.trim().startsWith('<span'))) {
                                // HTML içeriği güvenli bir şekilde ekle
                                messageContent.innerHTML = msg.content;
                                
                                // Blog slider için script'leri çalıştır
                                setTimeout(() => {
                                    // Slider script'lerini çalıştır
                                    const scripts = messageContent.querySelectorAll('script');
                                    scripts.forEach(oldScript => {
                                        const newScript = document.createElement('script');
                                        Array.from(oldScript.attributes).forEach(attr => {
                                            newScript.setAttribute(attr.name, attr.value);
                                        });
                                        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                                        oldScript.parentNode.replaceChild(newScript, oldScript);
                                    });
                                }, 100);
                            } else {
                                // Normal metin içeriği
                                messageContent.textContent = msg.content;
                            }
                            
                            // Zaman damgası oluştur
                            const timestamp = document.createElement('div');
                            timestamp.className = 'timestamp';
                            
                            // Mesaj zamanını formatla
                            const msgDate = new Date(msg.timestamp);
                            const now = new Date();
                            const isToday = msgDate.toDateString() === now.toDateString();
                            
                            if (isToday) {
                                // Bugünkü mesajlar için saat:dakika formatı
                                timestamp.textContent = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else {
                                // Diğer günler için tarih formatı
                                timestamp.textContent = msgDate.toLocaleDateString();
                            }
                            
                            // İçerik ve zaman damgasını wrapper'a ekle
                            contentWrapper.appendChild(messageContent);
                            contentWrapper.appendChild(timestamp);
                            
                            // Wrapper'ı mesaj div'ine ekle
                            messageDiv.appendChild(contentWrapper);
                            
                            chatMessages.appendChild(messageDiv);
                        }
                    } else {
                        // Eğer mesaj yoksa hoşgeldin mesajı ekle
                        addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
                    }
                    
                    // Yumuşak animasyonla aşağı kaydır
                    chatMessages.scrollTo({
                        top: chatMessages.scrollHeight,
                        behavior: 'smooth'
                    });
                } else {
                    // Hata durumunda yeni bir conversation başlat
                    loadingMessage.remove();
                    conversationId = null;
                    localStorage.removeItem('chachaConversationId');
                    addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'bot');
                }
            } catch (error) {
                console.error('Error loading conversation history:', error);
                // Hata durumunda yeni bir conversation başlat
                conversationId = null;
                localStorage.removeItem('chachaConversationId');
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
                localStorage.removeItem('chachaConversationId');
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
                // API endpoint'i - bu kısmı kendi API'nize göre değiştirin
                const response = await fetch(`${SITE_URL}:${PORT}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        message,
                        conversationId // Eğer null ise, backend yeni bir conversation oluşturacak
                    }),
                });

                const data = await response.json();
                
                // Yükleniyor mesajını kaldır
                loadingMessage.remove();
                
                if (response.ok) {
                    addMessage(data.response, 'bot');
                    
                    // Conversation ID'yi sakla
                    if (data.conversationId) {
                        conversationId = data.conversationId;
                        localStorage.setItem('chachaConversationId', conversationId);
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
        function addMessage(content, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            
            // Avatar ekle
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            
            if (sender === 'bot') {
                const avatarImg = document.createElement('img');
                avatarImg.src = `${SITE_URL}:${PORT}/img/my-profile-img.jpg` ;
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
            if (sender === 'bot' && (content.trim().startsWith('<div') || content.trim().startsWith('<p') || content.trim().startsWith('<span'))) {
                // HTML içeriği güvenli bir şekilde ekle
                messageContent.innerHTML = content;
                
                // Blog slider için script'leri çalıştır
                setTimeout(() => {
                    // Slider script'lerini çalıştır
                    const scripts = messageContent.querySelectorAll('script');
                    scripts.forEach(oldScript => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                }, 100);
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
                behavior: 'smooth'
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
            avatarImg.src = `${SITE_URL}:${PORT}/img/my-profile-img.jpg`;
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
                behavior: 'smooth'
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