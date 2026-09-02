import { ArrowLeft, Copy, Check, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Award } from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { Analysis } from '@/types';

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#338eff' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-4xl font-extrabold text-neutral-900">{score}</div>
        <div className="text-xs text-neutral-500 mt-0.5">out of 100</div>
        <div className="text-sm font-semibold mt-1" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

function CategoryBar({ label, score, description }: { label: string; score: number; description: string }) {
  const color = score >= 80 ? 'bg-accent-500' : score >= 60 ? 'bg-primary-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-accent-600' : score >= 60 ? 'text-primary-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: { category: string; priority: string; title: string; description: string; example?: string } }) {
  const priorityConfig = {
    high: { color: 'bg-red-50 text-red-600 border-red-200', icon: <AlertTriangle size={14} />, label: 'High Priority' },
    medium: { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Lightbulb size={14} />, label: 'Medium Priority' },
    low: { color: 'bg-primary-50 text-primary-600 border-primary-200', icon: <Lightbulb size={14} />, label: 'Low Priority' },
  };
  const config = priorityConfig[suggestion.priority as 'high' | 'medium' | 'low'] || priorityConfig.medium;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
          <span className="text-xs text-neutral-400">{suggestion.category}</span>
        </div>
      </div>
      <h4 className="font-semibold text-neutral-900 mb-1.5">{suggestion.title}</h4>
      <p className="text-sm text-neutral-600 leading-relaxed">{suggestion.description}</p>
      {suggestion.example && (
        <div className="mt-3 bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-sm text-neutral-600 leading-relaxed">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Example</span>
          <p className="mt-1">{suggestion.example}</p>
        </div>
      )}
    </Card>
  );
}

export function ResultsView({ analysis, onBack }: { analysis: Analysis; onBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      `Resume Score: ${analysis.overall_score}/100`,
      '',
      analysis.summary,
      '',
      'Category Scores:',
      ...analysis.category_scores.map((c) => `  ${c.label}: ${c.score}/100`),
      '',
      'Suggestions:',
      ...analysis.suggestions.map((s) => `[${s.priority.toUpperCase()}] ${s.title}: ${s.description}${s.example ? ` (Example: ${s.example})` : ''}`),
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1 p-8 flex flex-col items-center justify-center animate-scale-in">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Overall Score</h2>
            <ScoreRing score={analysis.overall_score} />
            <p className="text-sm text-neutral-500 text-center mt-4 leading-relaxed">{analysis.summary}</p>
          </Card>

          <Card className="lg:col-span-2 p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="text-primary-500" size={20} />
              <h2 className="text-lg font-bold text-neutral-900">Category Breakdown</h2>
            </div>
            <div className="space-y-5">
              {analysis.category_scores.map((cat, i) => (
                <CategoryBar key={i} label={cat.label} score={cat.score} description={cat.description} />
              ))}
            </div>
          </Card>
        </div>

        {analysis.strengths && analysis.strengths.length > 0 && (
          <Card className="p-6 sm:p-8 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-accent-500" size={20} />
              <h2 className="text-lg font-bold text-neutral-900">What's Working Well</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.strengths.map((strength, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-accent-50/50 border border-accent-100 rounded-xl p-3.5">
                  <Check className="text-accent-500 mt-0.5 shrink-0" size={18} />
                  <p className="text-sm text-neutral-700 leading-relaxed">{strength}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary-500" size={20} />
            <h2 className="text-lg font-bold text-neutral-900">Suggestions to Improve</h2>
            <span className="text-sm text-neutral-400">({analysis.suggestions.length})</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.suggestions.map((suggestion, i) => (
            <SuggestionCard key={i} suggestion={suggestion} />
          ))}
        </div>
      </div>
    </div>
  );
}
