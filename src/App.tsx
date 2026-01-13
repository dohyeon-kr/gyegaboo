import { useState, useEffect } from 'react';
import { AIChat } from './components/AIChat';
import { ImageUpload } from './components/ImageUpload';
import { Statistics } from './components/Statistics';
import { ExpenseList } from './components/ExpenseList';
import { ManualEntry } from './components/ManualEntry';
import { RecurringExpenses } from './components/RecurringExpenses';
import { useExpenseStore } from './stores/expenseStore';
import './App.css';

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
    <div className="app">
      <header className="app-header">
        <h1>가계부</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => setActiveTab('list')}
          >
            목록
          </button>
          <button
            className={activeTab === 'statistics' ? 'active' : ''}
            onClick={() => setActiveTab('statistics')}
          >
            통계
          </button>
          <button
            className={activeTab === 'ai' ? 'active' : ''}
            onClick={() => setActiveTab('ai')}
          >
            AI 대화
          </button>
          <button
            className={activeTab === 'image' ? 'active' : ''}
            onClick={() => setActiveTab('image')}
          >
            이미지
          </button>
          <button
            className={activeTab === 'manual' ? 'active' : ''}
            onClick={() => setActiveTab('manual')}
          >
            수동 입력
          </button>
          <button
            className={activeTab === 'recurring' ? 'active' : ''}
            onClick={() => setActiveTab('recurring')}
          >
            고정비
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'list' && <ExpenseList />}
        {activeTab === 'statistics' && <Statistics />}
        {activeTab === 'ai' && <AIChat />}
        {activeTab === 'image' && <ImageUpload />}
        {activeTab === 'manual' && <ManualEntry />}
        {activeTab === 'recurring' && <RecurringExpenses />}
      </main>
    </div>
  );
}

export default App;
