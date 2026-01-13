import { useState } from 'react';
import { AIService } from '../services/aiService';
import { useExpenseStore } from '../stores/expenseStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addItems } = useExpenseStore();
  const { toast } = useToast();

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
        await addItems(response.data);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: response.message || `${response.data.length}개의 항목이 추가되었습니다.`,
          },
        ]);
        toast({
          title: "추가 완료",
          description: `${response.data.length}개의 항목이 추가되었습니다.`,
        });
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
      toast({
        title: "오류",
        description: "AI 응답을 받는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>AI 가계부 어시스턴트</CardTitle>
        <CardDescription>자연어로 가계부를 관리하세요</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/50 rounded-lg">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>AI와 대화하여 가계부를 관리하세요.</p>
              <p className="text-sm mt-2">예: "오늘 커피 5000원 지출했어"</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-card border rounded-lg px-4 py-2">
                <p className="text-sm text-muted-foreground">처리 중...</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
