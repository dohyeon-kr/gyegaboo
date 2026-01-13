import { useState } from 'react';
import { AIService } from '../services/aiService';
import { useExpenseStore } from '../stores/expenseStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addItems } = useExpenseStore();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await AIService.chat(newMessages);
      
      if (response.success && response.data && response.data.length > 0) {
        // 가계부 항목이 생성된 경우
        addItems(response.data);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: response.message || `${response.data.length}개의 항목이 추가되었습니다.`,
          },
        ]);
      } else if (response.message) {
        // 일반 응답인 경우
        setMessages([
          ...newMessages,
          { role: 'assistant', content: response.message },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: '응답을 받지 못했습니다.' },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '오류가 발생했습니다. 다시 시도해주세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <h2>AI 가계부 어시스턴트</h2>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-message">
            AI와 대화하여 가계부를 관리하세요. 예: "오늘 커피 5000원 지출했어"
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">처리 중...</div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          전송
        </button>
      </div>
    </div>
  );
}
