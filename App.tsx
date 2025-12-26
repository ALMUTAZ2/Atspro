
import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { JobMatchModal } from './components/JobMatchModal';
import { AppStep, AnalysisResult, ResumeSection } from './types';
import { GeminiService } from './services/geminiService';
import { DocumentService } from './services/documentService';
import { Cpu, Github, Sparkles, Key, AlertTriangle, ShieldCheck } from 'lucide-react';

// Extend the global window object to include the aistudio helpers, matching system definitions
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      // Check if window.aistudio exists before calling its methods
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } else {
        setApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume the key selection was successful to mitigate race condition
      setApiKeySelected(true);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const text = await DocumentService.extractText(file);
      setResumeText(text);
      
      const gemini = new GeminiService();
      const result = await gemini.analyzeResume(text);
      
      setAnalysis(result);
      setSections(result.structuredSections);
      
      setStep(AppStep.DASHBOARD);
    } catch (err: any) {
      console.error("Critical diagnostic error:", err);
      // Handle potential API key errors as specified in guidelines
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        alert('API Quota exceeded. PROPHET requires a valid paid API key for deep analysis.');
        handleOpenKeySelector();
      } else if (err.message?.includes('Requested entity was not found')) {
        alert('Diagnostic Kernel failure: API Key invalid.');
        setApiKeySelected(false);
        handleOpenKeySelector();
      } else {
        alert('Error performing forensic audit. Check your connection or API key.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTailoring = (tailoredSections: ResumeSection[]) => {
    setSections(tailoredSections);
    setStep(AppStep.EDITOR);
  };

  if (apiKeySelected === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
            <Key size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            PROPHET V4.1 forensic analysis requires a high-tier API key for processing complex structural data.
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
            >
              Select Authorized Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
              rel="noreferrer"
            >
              API Quotas & Billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(AppStep.UPLOAD)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transition-transform active:scale-95">
              <ShieldCheck size={22} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">PROPHET<span className="text-indigo-600">V4.1</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleOpenKeySelector}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
              title="Change API Key"
            >
              <Key size={18} />
            </button>
            <button onClick={() => setStep(AppStep.UPLOAD)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Abort Session</button>
            <a href="https://github.com" target="_blank" className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-slate-600">
              <Github size={18} />
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 w-full py-10">
        {loading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Initiating Forensic Audit...</h2>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-mono text-xs">
              [SYSTEM] PROPHET V4.1 Diagnostic Kernel...<br/>
              [SYSTEM] Applying synonym awareness filters...<br/>
              [SYSTEM] Normalizing section structures...<br/>
              [SYSTEM] Extracting raw metric density...
            </p>
          </div>
        ) : (
          <>
            {step === AppStep.UPLOAD && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center max-w-2xl mx-auto pt-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
                    <Cpu size={12} /> Enterprise Diagnostic Kernel V4.1
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                    Survive the <span className="text-indigo-600">Bot Screen</span>
                  </h1>
                  <p className="text-xl text-slate-500 leading-relaxed font-medium">
                    PROPHET V4.1 forensic auditor extracts the raw structural data bots use to mathematically reject you. 
                  </p>
                </div>
                <FileUploader onUpload={handleUpload} />
              </div>
            )}
            {step === AppStep.DASHBOARD && analysis && (
              <Dashboard 
                result={analysis} 
                onEdit={() => setStep(AppStep.EDITOR)} 
                onOpenMatch={() => setShowMatchModal(true)} 
              />
            )}
            {step === AppStep.EDITOR && (
              <Editor sections={sections} onBack={() => setStep(AppStep.DASHBOARD)} />
            )}
          </>
        )}
      </main>

      {showMatchModal && (
        <JobMatchModal 
          resumeText={resumeText} 
          sections={sections}
          onClose={() => setShowMatchModal(false)} 
          onApplyTailoring={handleApplyTailoring}
        />
      )}
    </div>
  );
};

export default App;
