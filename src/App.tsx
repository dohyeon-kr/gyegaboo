import { useState, useEffect } from 'react';
import { AIChat } from './components/AIChat';
import { ImageUpload } from './components/ImageUpload';
import { Statistics } from './components/Statistics';
import { ExpenseList } from './components/ExpenseList';
import { ManualEntry } from './components/ManualEntry';
import { RecurringExpenses } from './components/RecurringExpenses';
import { InviteMember } from './components/InviteMember';
import { Profile } from './components/Profile';
import { ThemeToggle } from './components/ThemeToggle';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { useExpenseStore } from './stores/expenseStore';
import { useAuthStore } from './stores/authStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Card } from './components/ui/card';

type Tab = 'list' | 'statistics' | 'ai' | 'image' | 'manual' | 'recurring' | 'invite' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const { fetchItems, fetchCategories } = useExpenseStore();
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  useEffect(() => {
    // 인증 상태 확인
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // 인증된 경우에만 데이터 로드
    if (isAuthenticated) {
      fetchItems();
      fetchCategories();
    }
  }, [isAuthenticated, fetchItems, fetchCategories]);

  // URL에서 토큰이 있으면 회원가입 페이지 표시
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');
  if (inviteToken) {
    return <Register />;
  }

  // 로딩 중이거나 인증되지 않은 경우 로그인 페이지 표시
  if (isLoading || !isAuthenticated || user?.isInitialAdmin) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-7xl">
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">가계부</h1>
              <ThemeToggle />
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="list">목록</TabsTrigger>
                <TabsTrigger value="statistics">통계</TabsTrigger>
                <TabsTrigger value="ai">AI 대화</TabsTrigger>
                <TabsTrigger value="image">이미지</TabsTrigger>
                <TabsTrigger value="manual">수동 입력</TabsTrigger>
                <TabsTrigger value="recurring">고정비</TabsTrigger>
                <TabsTrigger value="invite">초대</TabsTrigger>
                <TabsTrigger value="profile">프로필</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
              <TabsContent value="list" className="mt-0">
                <ExpenseList />
              </TabsContent>
              <TabsContent value="statistics" className="mt-0">
                <Statistics />
              </TabsContent>
              <TabsContent value="ai" className="mt-0">
                <AIChat />
              </TabsContent>
              <TabsContent value="image" className="mt-0">
                <ImageUpload />
              </TabsContent>
              <TabsContent value="manual" className="mt-0">
                <ManualEntry />
              </TabsContent>
              <TabsContent value="recurring" className="mt-0">
                <RecurringExpenses />
              </TabsContent>
              <TabsContent value="invite" className="mt-0">
                <InviteMember />
              </TabsContent>
              <TabsContent value="profile" className="mt-0">
                <Profile />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
