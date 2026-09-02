import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { ResultsView } from '@/components/ResultsView';
import { HistoryPage } from '@/components/HistoryPage';
import { Spinner } from '@/components/ui';
import type { Analysis } from '@/types';

type Page = 'home' | 'history' | 'results';

function AppContent() {
  const { loading } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    setPage('results');
  };

  const handleSelectAnalysis = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    setPage('results');
  };

  const handleNavigate = (p: Page) => {
    setPage(p);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar page={page} onNavigate={handleNavigate} />
      {page === 'home' && <LandingPage onAnalysisComplete={handleAnalysisComplete} />}
      {page === 'history' && <HistoryPage onSelectAnalysis={handleSelectAnalysis} />}
      {page === 'results' && currentAnalysis && (
        <ResultsView analysis={currentAnalysis} onBack={() => setPage('home')} />
      )}
      {page === 'results' && !currentAnalysis && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-neutral-500">No analysis selected. Go back and upload a resume.</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
