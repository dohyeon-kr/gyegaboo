import { useState, useEffect } from 'react';
import { AIChat } from './components/AIChat';
import { ImageUpload } from './components/ImageUpload';
import { Statistics } from './components/Statistics';
import { ExpenseList } from './components/ExpenseList';
import { ManualEntry } from './components/ManualEntry';
import { RecurringExpenses } from './components/RecurringExpenses';
import { ThemeToggle } from './components/ThemeToggle';
import { useExpenseStore } from './stores/expenseStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Card } from './components/ui/card';

type Tab = 'list' | 'statistics' | 'ai' | 'image' | 'manual' | 'recurring';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const { fetchItems, fetchCategories } = useExpenseStore();

  useEffect(() => {
    // 앱 시작 시 데이터 로드
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="list">목록</TabsTrigger>
                <TabsTrigger value="statistics">통계</TabsTrigger>
                <TabsTrigger value="ai">AI 대화</TabsTrigger>
                <TabsTrigger value="image">이미지</TabsTrigger>
                <TabsTrigger value="manual">수동 입력</TabsTrigger>
                <TabsTrigger value="recurring">고정비</TabsTrigger>
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
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
