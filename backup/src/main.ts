import './index.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 默认头像 URL（本地生成的）
const DEFAULT_AVATAR_TEXT = 'WX';

// 存储当前头像状态
let currentAvatar: { type: 'text' | 'image'; value: string } = { type: 'text', value: DEFAULT_AVATAR_TEXT };

// 渲染页面
function renderPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const avatarHtml = currentAvatar.type === 'image'
    ? `<img src="${currentAvatar.value}" alt="头像" class="avatar-img" />`
    : `<span>${currentAvatar.value}</span>`;

  app.innerHTML = `
    <div class="app-container">
      <!-- 头部区域 -->
      <header class="header">
        <div class="profile-section">
          <div class="avatar-wrapper">
            <div class="avatar" id="avatarContainer">
              ${avatarHtml}
            </div>
            <button class="avatar-upload-btn" id="avatarUploadBtn" title="上传头像">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            <input type="file" id="avatarInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display: none;" />
          </div>
          <div class="profile-info">
            <h1>WX</h1>
            <p class="tagline">一个正在探索AI与教育教学深度融合的大学教师</p>
          </div>
        </div>
      </header>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 关于我 -->
        <section class="card about-card">
          <h2 class="card-title">关于我</h2>
          <div class="about-content">
            <div class="info-item">
              <span class="info-label">研究方向</span>
              <span class="info-value">人工智能通识课程教学 & 现代教育技术</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前工作</span>
              <span class="info-value">本科AI通识课教学 & 硕士生培养</span>
            </div>
            <div class="info-item">
              <span class="info-label">个人兴趣</span>
              <div class="interest-tags">
                <span class="tag">智慧教育</span>
                <span class="tag">日本影视剧</span>
                <span class="tag">花样滑冰</span>
              </div>
            </div>
            <div class="highlight">
              <span class="info-label">一个特点</span>
              <span class="info-value">温和、耐心，喜欢把复杂问题讲成人听得懂的话</span>
            </div>
          </div>
        </section>

        <!-- 数字分身聊天区 -->
        <section class="card chat-section">
          <h2 class="card-title">和我的数字分身聊聊</h2>
          <div class="chat-messages" id="chatMessages">
            <div class="message assistant">
              你好！我是WX的数字分身，有什么想了解的可以问我～ 比如我的研究方向、对学生的期望，或者怎么联系我，都可以聊聊。
            </div>
          </div>
          <div class="chat-input-container">
            <input 
              type="text" 
              class="chat-input" 
              id="chatInput" 
              placeholder="输入你的问题..."
              autocomplete="off"
            />
            <button class="send-btn" id="sendBtn">发送</button>
          </div>
        </section>
      </main>

      <!-- 页脚 -->
      <footer class="footer">
        <p>期待与你交流 | AI教育探索中</p>
        <a href="mailto:544069255@qq.com" class="contact-btn" title="发邮件联系我">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </a>
      </footer>
    </div>
  `;

  // 初始化头像上传功能
  initAvatarUpload();
  // 初始化聊天功能
  initChat();
}

// 头像上传功能
function initAvatarUpload(): void {
  const uploadBtn = document.getElementById('avatarUploadBtn') as HTMLButtonElement;
  const avatarInput = document.getElementById('avatarInput') as HTMLInputElement;
  const avatarContainer = document.getElementById('avatarContainer');

  if (!uploadBtn || !avatarInput || !avatarContainer) return;

  // 点击上传按钮触发文件选择
  uploadBtn.addEventListener('click', () => {
    avatarInput.click();
  });

  // 文件选择后处理上传
  avatarInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('请选择 JPG、PNG、GIF 或 WebP 格式的图片');
      return;
    }

    // 显示上传中状态
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="upload-loading">压缩中...</span>';

    try {
      // 压缩并转换为 base64
      const { base64, resized } = await compressImage(file);

      // 如果图片被压缩，显示"上传中..."
      if (resized) {
        uploadBtn.innerHTML = '<span class="upload-loading">上传中...</span>';
      }

      // 上传到服务器
      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          fileName: file.name,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }

      const data = await response.json();

      // 更新头像显示
      currentAvatar = { type: 'image', value: data.url };
      avatarContainer.innerHTML = `<img src="${data.url}" alt="头像" class="avatar-img" />`;

      // 保存到本地存储以便刷新后保持
      localStorage.setItem('userAvatarUrl', data.url);

      console.log('头像上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      `;
      // 清空 input 以允许重复选择同一文件
      avatarInput.value = '';
    }
  });

  // 检查本地存储中是否有已保存的头像
  const savedAvatarUrl = localStorage.getItem('userAvatarUrl');
  if (savedAvatarUrl) {
    currentAvatar = { type: 'image', value: savedAvatarUrl };
    avatarContainer.innerHTML = `<img src="${savedAvatarUrl}" alt="头像" class="avatar-img" />`;
  }
}

// 将文件转换为 base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:image/...;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 压缩图片并转换为 base64
function compressImage(file: File): Promise<{ base64: string; resized: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 头像最大尺寸 400x400
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // 创建画布并压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建画布上下文'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // 压缩为 JPEG，质量 0.8
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];

        resolve({
          base64,
          resized: width < img.width || height < img.height,
        });
      };
      img.onerror = () => reject(new Error('无法加载图片'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsDataURL(file);
  });
}

// 聊天功能
let conversationHistory: Message[] = [];

function initChat(): void {
  const chatMessagesEl = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput') as HTMLInputElement;
  const sendBtn = document.getElementById('sendBtn');

  if (!chatMessagesEl || !chatInput || !sendBtn) return;

  const chatMessages = chatMessagesEl;

  // 发送消息
  const sendMessage = async (): Promise<void> => {
    const message = chatInput.value.trim();
    if (!message) return;

    // 清空输入框
    chatInput.value = '';

    // 添加用户消息
    addMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });

    // 显示加载状态
    const typingDiv = addTypingIndicator();

    try {
      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // 移除加载指示器
      typingDiv.remove();

      // 解析 JSON 响应
      const data = await response.json();
      const fullContent = data.content || '抱歉，我没有得到有效回复。';

      // 添加 AI 响应
      addMessage('assistant', fullContent);

      // 保存到历史
      conversationHistory.push({ role: 'assistant', content: fullContent });
    } catch (error) {
      console.error('Chat error:', error);
      typingDiv.remove();
      addMessage('assistant', '抱歉，出了点小问题，请稍后再试。');
    }
  };

  // 添加消息到聊天区域
  function addMessage(role: 'user' | 'assistant', content: string): HTMLDivElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
  }

  // 添加加载指示器
  function addTypingIndicator(): HTMLDivElement {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
  }

  // 滚动到底部
  function scrollToBottom(): void {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 绑定事件
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// 导出初始化函数
export function initApp(): void {
  renderPage();
}
