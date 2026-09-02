import { useEffect, useState } from 'react';
import { History, FileText, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import type { Analysis, Resume } from '@/types';

interface HistoryItem extends Analysis {
  resumes?: Resume;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-accent-600 bg-accent-50';
  if (score >= 60) return 'text-primary-600 bg-primary-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function HistoryPage({ onSelectAnalysis }: { onSelectAnalysis: (analysis: Analysis) => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from('analyses')
        .select('*, resumes!inner(file_name, file_type, created_at)')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setItems((data || []) as HistoryItem[]);
      setLoading(false);
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <History className="text-primary-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Analysis History</h1>
            <p className="text-sm text-neutral-500">{items.length} {items.length === 1 ? 'resume' : 'resumes'} analyzed</p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto text-neutral-300 mb-4" size={48} />
            <h3 className="font-semibold text-neutral-700 mb-1">No analyses yet</h3>
            <p className="text-sm text-neutral-500">Upload your first resume to see it here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-5 hover:shadow-md hover:border-primary-200 cursor-pointer transition-all duration-200 group animate-slide-up"
              >
                <button
                  onClick={() => onSelectAnalysis(item)}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <FileText className="text-neutral-500" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                      {item.resumes?.file_name || 'Resume'}
                    </h4>
                    <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{item.summary}</p>
                    <p className="text-xs text-neutral-400 mt-1">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${scoreColor(item.overall_score)}`}>
                      {item.overall_score}
                    </div>
                    <ChevronRight className="text-neutral-300 group-hover:text-primary-500 transition-colors" size={20} />
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
