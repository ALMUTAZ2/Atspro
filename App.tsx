
import React, { useState, useEffect, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { JobMatchModal } from './components/JobMatchModal';
import { AppStep, AnalysisResult, ResumeSection } from './types';
import { GeminiService } from './services/geminiService';
import { DocumentService } from './services/documentService';
import { Cpu, Sparkles, Key, ShieldCheck, RefreshCcw } from 'lucide-react';

const STORAGE_KEYS = {
  STEP: 'ats_v4_step',
  RESUME: 'ats_v4_resume',
  ANALYSIS: 'ats_v4_analysis',
  SECTIONS: 'ats_v4_sections'
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(() => (localStorage.getItem(STORAGE_KEYS.STEP) as AppStep) || AppStep.UPLOAD);
  const [resumeText, setResumeText] = useState(() => localStorage.getItem(STORAGE_KEYS.RESUME) || '');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANALYSIS);
    return saved ? JSON.parse(saved) : null;
  });
  const [sections, setSections] = useState<ResumeSection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(has);
      } else { setApiKeyReady(true); }
    };
    checkKey();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STEP, step);
    localStorage.setItem(STORAGE_KEYS.RESUME, resumeText);
    if (analysis) localStorage.setItem(STORAGE_KEYS.ANALYSIS, JSON.stringify(analysis));
    if (sections.length) localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
  }, [step, resumeText, analysis, sections]);

  const handleReset = useCallback(() => {
    if (confirm("هل تريد مسح البيانات الحالية والبدء بفحص ملف جديد؟")) {
      setStep(AppStep.UPLOAD);
      setResumeText('');
      setAnalysis(null);
      setSections([]);
      localStorage.clear();
      window.scrollTo(0, 0);
    }
  }, []);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const text = await DocumentService.extractText(file);
      setResumeText(text);
      const gemini = new GeminiService();
      const result = await gemini.analyzeResume(text);
      setAnalysis(result);
      setSections(result.structuredSections || []);
      setStep(AppStep.DASHBOARD);
    } catch (err: any) {
      alert("حدث خطأ في التحليل: " + (err.message || "يرجى المحاولة لاحقاً."));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTailoring = (tailored: ResumeSection[]) => {
    setSections(tailored);
    setStep(AppStep.EDITOR);
  };

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl">
          <Key className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-4">مفتاح API مطلوب</h2>
          <button onClick={() => window.aistudio?.openSelectKey().then(() => window.location.reload())} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">إعداد المفتاح</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="h-16 border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => step !== AppStep.UPLOAD && handleReset()}>
            <ShieldCheck className="text-indigo-600" size={32} />
            <span className="text-xl font-black uppercase">Prophet<span className="text-indigo-600">V4</span></span>
          </div>
          <div className="flex items-center gap-4">
            {step !== AppStep.UPLOAD && (
              <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <RefreshCcw size={14} /> Scan New File
              </button>
            )}
            <button onClick={() => window.aistudio?.openSelectKey()}><Key size={20} className="text-slate-400" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-pulse">
            <Cpu className="w-16 h-16 text-indigo-600 mb-6 animate-spin" />
            <h2 className="text-3xl font-black mb-2">جارٍ التدقيق الجنائي للبيانات...</h2>
            <p className="text-slate-500 font-medium">نستخدم محرك Gemini-3 لضمان أعلى دقة</p>
          </div>
        ) : (
          <>
            {step === AppStep.UPLOAD && (
              <div className="space-y-12 animate-in fade-in duration-700 pt-10 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase mb-6 tracking-widest">
                    <Sparkles size={12} /> AI Kernel V4.5 Active
                  </div>
                  <h1 className="text-5xl font-black mb-6 leading-tight">حلل سيرتك باحترافية <span className="text-indigo-600">الذكاء الاصطناعي</span></h1>
                  <p className="text-lg text-slate-500 font-medium">افحص سيرتك الذاتية مقابل أنظمة الـ ATS الأكثر تعقيداً في العالم.</p>
                </div>
                <FileUploader onUpload={handleUpload} />
              </div>
            )}
            {step === AppStep.DASHBOARD && analysis && (
              <Dashboard result={analysis} onEdit={() => setStep(AppStep.EDITOR)} onOpenMatch={() => setShowMatchModal(true)} onNewScan={handleReset} />
            )}
            {step === AppStep.EDITOR && (
              <Editor sections={sections} onBack={() => setStep(AppStep.DASHBOARD)} />
            )}
          </>
        )}
      </main>

      {showMatchModal && (
        <JobMatchModal resumeText={resumeText} sections={sections} onClose={() => setShowMatchModal(false)} onApplyTailoring={handleApplyTailoring} />
      )}
    </div>
  );
};

export default App;
