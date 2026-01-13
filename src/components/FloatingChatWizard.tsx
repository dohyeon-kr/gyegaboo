import { useState, useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { AIService } from '../services/aiService'
import { useExpenseStore } from '../stores/expenseStore'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Bot, X, Minimize2, Maximize2, Send, Sparkles } from 'lucide-react'
import { useToast } from './ui/use-toast'
import { getContextForPath, getGuideForPath } from '../utils/guides'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function FloatingChatWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const { fetchItems } = useExpenseStore()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 페이지 변경 시 컨텍스트 가이드 추가
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const guide = getGuideForPath(location.pathname)
      if (guide) {
        const contextMessage = `현재 "${guide.title}" 페이지에 있습니다.\n\n${guide.description}\n\n도움이 필요하시면 언제든지 물어보세요!`
        setMessages([{
          role: 'assistant',
          content: contextMessage,
        }])
      }
    }
  }, [location.pathname, isOpen])

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 열릴 때 입력 필드 포커스
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isMinimized])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // 현재 페이지 컨텍스트 가져오기
      const context = getContextForPath(location.pathname)
      
      // 시스템 메시지를 첫 번째 메시지로 추가 (실제 메시지 배열에는 포함하지 않음)
      const systemContext = `당신은 가계부 관리 AI 어시스턴트입니다. 현재 사용자는 "${location.pathname}" 페이지에 있습니다.\n\n${context}\n\n사용자의 질문에 친절하고 도움이 되는 답변을 제공하세요.`
      
      // 실제 대화 메시지만 전송 (시스템 컨텍스트는 백엔드에서 처리)
      const chatMessages = [
        ...messages.filter(m => m.role !== 'assistant' || !m.content.includes('현재 "')),
        { role: 'user' as const, content: userMessage },
      ]

      // 컨텍스트를 포함한 메시지 배열 생성
      const allMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'assistant', content: systemContext },
        ...chatMessages,
      ]

      const response = await AIService.chat(allMessages)
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message || '응답을 생성할 수 없습니다.' },
      ])

      // 항목이 생성된 경우 목록 새로고침
      if (response.data && response.data.length > 0) {
        await fetchItems()
        toast({
          title: '항목 추가 완료',
          description: `${response.data.length}개의 항목이 추가되었습니다.`,
        })
      }
      
      // 고정비가 생성된 경우
      if (response.recurringExpense) {
        await fetchItems()
        toast({
          title: '고정비 추가 완료',
          description: `고정비 "${response.recurringExpense.name}"가 추가되었습니다.`,
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleToggle = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="relative">
          {/* 글로우 효과 */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
          
          {/* 메인 버튼 */}
          <Button
            type="button"
            onClick={handleToggle}
            className="relative rounded-full h-16 w-16 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/95 hover:to-primary border-2 border-primary-foreground/30 hover:border-primary-foreground/50"
            style={{
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="relative z-10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
          </Button>
          
          {/* 라벨 - 호버 시 표시 */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-xl text-sm font-semibold border border-primary-foreground/20">
              AI 가이드
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">AI 가이드</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                  setMessages([])
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="p-0">
            <div className="flex flex-col h-[500px]">
              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">안녕하세요! 무엇을 도와드릴까요?</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
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
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">나</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
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
                <div ref={messagesEndRef} />
              </div>
              {/* 입력 영역 */}
              <div className="border-t p-4 bg-background">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
