import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Sparkles, FileCheck2, AlertCircle, Loader2, ArrowRight, CheckCircle2, Zap, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateFile, uploadResume, analyzeResume } from '@/lib/resume-service';
import { Button } from '@/components/ui';
import { AuthModal } from '@/components/AuthModal';
import type { Analysis } from '@/types';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export function LandingPage({ onAnalysisComplete }: { onAnalysisComplete: (analysis: Analysis) => void }) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploadState('error');
      return;
    }

    if (!user) {
      setShowAuth(true);
      return;
    }

    setUploadState('uploading');
    const { id: resumeId, error: uploadErr } = await uploadResume(file, user.id);
    if (uploadErr || !resumeId) {
      setError(uploadErr || 'Failed to upload file.');
      setUploadState('error');
      return;
    }

    setUploadState('analyzing');
    const { data, error: analysisErr } = await analyzeResume(resumeId);
    if (analysisErr || !data) {
      setError(analysisErr || 'Failed to analyze resume.');
      setUploadState('error');
      return;
    }

    setUploadState('done');
    setTimeout(() => {
      onAnalysisComplete(data as Analysis);
    }, 600);
  }, [user, onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const reset = () => {
    setUploadState('idle');
    setError(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
            <Sparkles size={15} />
            AI-Powered Resume Analysis
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-[1.1] tracking-tight animate-slide-up">
            Score your resume.
            <br />
            <span className="text-gradient">Land more interviews.</span>
          </h1>

          <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Upload your resume and get an instant AI-powered score with detailed feedback.
            Discover exactly what to improve and how to stand out to recruiters.
          </p>

          <div className="mt-10 max-w-2xl mx-auto animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? 'border-primary-400 bg-primary-50/50 scale-[1.01]'
                  : 'border-neutral-300 bg-white/60 hover:border-primary-300 hover:bg-primary-50/30'
              } ${uploadState === 'done' ? 'border-accent-400 bg-accent-50/30' : ''}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleSelect}
                className="hidden"
              />

              {uploadState === 'idle' && (
                <div className="px-6 py-12 sm:py-16">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5 shadow-lg shadow-primary-500/20">
                    <Upload className="text-white" size={28} />
                  </div>
                  <p className="text-lg font-semibold text-neutral-800">
                    Drop your resume here, or click to browse
                  </p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Supports PDF, DOC, and DOCX files up to 10 MB
                  </p>
                </div>
              )}

              {uploadState === 'uploading' && (
                <div className="px-6 py-12 sm:py-16">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-5">
                    <Loader2 className="animate-spin text-primary-500" size={28} />
                  </div>
                  <p className="text-lg font-semibold text-neutral-800">Uploading your resume...</p>
                  <p className="text-sm text-neutral-500 mt-2 truncate max-w-xs mx-auto">{fileName}</p>
                </div>
              )}

              {uploadState === 'analyzing' && (
                <div className="px-6 py-12 sm:py-16">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5">
                    <Sparkles className="text-white animate-pulse" size={28} />
                  </div>
                  <p className="text-lg font-semibold text-neutral-800">AI is analyzing your resume...</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Scoring content, formatting, keywords, and impact
                  </p>
                  <div className="mt-4 flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {uploadState === 'done' && (
                <div className="px-6 py-12 sm:py-16">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-100 flex items-center justify-center mb-5">
                    <CheckCircle2 className="text-accent-600" size={28} />
                  </div>
                  <p className="text-lg font-semibold text-neutral-800">Analysis complete!</p>
                  <p className="text-sm text-neutral-500 mt-2">Loading your results...</p>
                </div>
              )}

              {uploadState === 'error' && (
                <div className="px-6 py-12 sm:py-16">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-5">
                    <AlertCircle className="text-red-500" size={28} />
                  </div>
                  <p className="text-lg font-semibold text-neutral-800">Something went wrong</p>
                  <p className="text-sm text-red-500 mt-2 max-w-xs mx-auto">{error}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="mt-4 text-sm text-primary-600 font-medium hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {!user && uploadState === 'idle' && (
              <p className="text-sm text-neutral-500 mt-4">
                Sign in to upload and analyze your resume
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Target size={22} />, title: 'Detailed Scoring', desc: 'Get an overall score plus breakdowns across 5 key categories that recruiters care about.' },
            { icon: <Zap size={22} />, title: 'Actionable Feedback', desc: 'Receive specific, prioritized suggestions with examples showing exactly what to improve.' },
            { icon: <TrendingUp size={22} />, title: 'Track Progress', desc: 'Save every analysis to your history and watch your resume score improve over time.' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How it works</h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10">
            Three simple steps from upload to actionable insights
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Upload size={20} />, title: 'Upload', desc: 'Drop your PDF, DOC, or DOCX resume' },
              { step: '02', icon: <Sparkles size={20} />, title: 'AI Analysis', desc: 'AI scores and reviews your resume' },
              { step: '03', icon: <FileCheck2 size={20} />, title: 'Improve', desc: 'Follow suggestions to boost your score' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 mx-auto">
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-primary-400 mb-1">{item.step}</div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
            Ready to improve your resume?
          </h2>
          <p className="text-neutral-600 mb-6">
            Create a free account and get your first AI resume analysis in seconds.
          </p>
          <Button size="lg" onClick={() => setShowAuth(true)}>
            Get Started Free
            <ArrowRight size={18} />
          </Button>
        </section>
      )}

      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <FileText size={18} />
            <span className="font-medium">ResumeAI</span>
          </div>
          <p className="text-sm text-neutral-400">AI-powered resume analysis and scoring</p>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
