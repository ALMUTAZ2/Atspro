
import React, { useState, useRef, useEffect } from 'react';
import { ResumeSection, ImprovedContent } from '../types';
import { Edit3, Sparkles, Download, ArrowLeft, Loader2, Bold, List, Wand2, FileText, FileDown, Eye } from 'lucide-react';
import { ExportService } from '../services/exportService';
import { GeminiService } from '../services/geminiService';

const RichEditor: React.FC<{ value: string; onChange: (val: string) => void; readOnly?: boolean }> = ({ value, onChange, readOnly }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, [value]);
  const onInput = () => ref.current && onChange(ref.current.innerHTML);
  return (
    <div 
      ref={ref} contentEditable={!readOnly} onInput={onInput}
      className={`p-8 rounded-[2rem] bg-white border-2 border-slate-100 min-h-[200px] outline-none font-serif text-lg leading-relaxed ${readOnly ? 'opacity-60 cursor-not-allowed' : 'focus:border-indigo-200'}`}
    />
  );
};

export const Editor: React.FC<{ sections: ResumeSection[]; onBack: () => void }> = ({ sections, onBack }) => {
  const [currentSections, setCurrentSections] = useState(sections);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<Record<string, ImprovedContent | null>>({});
  const [showExport, setShowExport] = useState(false);

  const handleUpdate = (id: string, content: string) => {
    setCurrentSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const handleImproveAll = async () => {
    setGlobalLoading(true);
    try {
      const gemini = new GeminiService();
      const results = await gemini.bulkImproveATS(currentSections);
      setCurrentSections(prev => prev.map(s => ({ ...s, content: results[s.id] || s.content })));
      alert("تم تحسين كافة الأقسام بنجاح!");
    } catch (err) { alert("حدث خطأ أثناء التحسين."); }
    finally { setGlobalLoading(false); }
  };

  const handleImproveSingle = async (section: ResumeSection) => {
    setLoadingMap(prev => ({ ...prev, [section.id]: true }));
    try {
      const gemini = new GeminiService();
      const res = await gemini.improveSection(section.title, section.content);
      setSuggestions(prev => ({ ...prev, [section.id]: res }));
    } catch (err) { alert("فشل الاتصال بالمحرك."); }
    finally { setLoadingMap(prev => ({ ...prev, [section.id]: false })); }
  };

  const apply = (id: string, type: 'professional' | 'atsOptimized') => {
    const sug = suggestions[id];
    if (sug) {
      handleUpdate(id, sug[type]);
      setSuggestions(prev => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center justify-between bg-white/90 p-4 rounded-3xl border sticky top-20 z-40 shadow-xl backdrop-blur-md">
        <button onClick={onBack} className="flex items-center gap-2 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all">
          <ArrowLeft size={18} /> العودة
        </button>
        <div className="relative">
          <button onClick={() => setShowExport(!showExport)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 transition-all">
            <Download size={18} /> تصدير الملف
          </button>
          {showExport && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-2xl shadow-2xl p-2 z-50">
              <button onClick={() => ExportService.generatePdf(currentSections)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-sm font-bold"><FileDown size={16} /> PDF</button>
              <button onClick={() => ExportService.generateDocx(currentSections)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-sm font-bold"><FileText size={16} /> Word</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black flex items-center gap-2"><Wand2 className="text-indigo-400" /> ATS Smart Refine</h3>
          <p className="text-slate-400 font-medium">تحسين شامل لكافة الأقسام بضغطة واحدة.</p>
        </div>
        <button 
          onClick={handleImproveAll} disabled={globalLoading}
          className="bg-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2 active:scale-95"
        >
          {globalLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} تحسين الكل
        </button>
      </div>

      <div className="space-y-12">
        {currentSections.map(s => (
          <div key={s.id} className="relative pt-4">
            <div className="absolute -top-2 left-8 z-10 bg-slate-800 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{s.title}</div>
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-end gap-2 mb-6">
                <button 
                  onClick={() => handleImproveSingle(s)} disabled={loadingMap[s.id]}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {loadingMap[s.id] ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} تحسين هذا القسم
                </button>
              </div>
              
              {suggestions[s.id] ? (
                <div className="grid md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                  <div onClick={() => apply(s.id, 'atsOptimized')} className="p-6 rounded-3xl border-2 border-emerald-100 bg-emerald-50/20 hover:border-emerald-500 cursor-pointer transition-all">
                    <span className="text-[10px] font-black text-emerald-600 block mb-4 uppercase">ATS Optimized</span>
                    <div dangerouslySetInnerHTML={{ __html: suggestions[s.id]!.atsOptimized }} className="text-sm font-serif leading-relaxed" />
                  </div>
                  <div onClick={() => apply(s.id, 'professional')} className="p-6 rounded-3xl border-2 border-indigo-100 bg-indigo-50/20 hover:border-indigo-500 cursor-pointer transition-all">
                    <span className="text-[10px] font-black text-indigo-600 block mb-4 uppercase">Professional</span>
                    <div dangerouslySetInnerHTML={{ __html: suggestions[s.id]!.professional }} className="text-sm font-serif leading-relaxed" />
                  </div>
                </div>
              ) : (
                <RichEditor value={s.content} onChange={(val) => handleUpdate(s.id, val)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
