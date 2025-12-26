
import React, { useState } from 'react';
import { ResumeSection } from '../types';
import { Edit3, Sparkles, Download, ArrowLeft, Check, Loader2, X, RefreshCw, FileText, FileDown, Eye } from 'lucide-react';
import { ExportService } from '../services/exportService';
import { GeminiService, ImprovedContent } from '../services/geminiService';

interface EditorProps {
  sections: ResumeSection[];
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ sections, onBack }) => {
  const [currentSections, setCurrentSections] = useState<ResumeSection[]>(sections);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [activeSuggestions, setActiveSuggestions] = useState<Record<string, ImprovedContent | null>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [peekingIds, setPeekingIds] = useState<Set<string>>(new Set());

  const handleUpdate = (id: string, newContent: string) => {
    setCurrentSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const startPeeking = (id: string) => {
    setPeekingIds(prev => new Set(prev).add(id));
  };

  const stopPeeking = (id: string) => {
    setPeekingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleImproveRequest = async (section: ResumeSection) => {
    if (loadingStates[section.id]) return;
    
    setLoadingStates(prev => ({ ...prev, [section.id]: true }));
    try {
      const gemini = new GeminiService();
      const result = await gemini.improveSection(section.title, section.content);
      setActiveSuggestions(prev => ({ ...prev, [section.id]: result }));
    } catch (err) {
      console.error(err);
      alert('Failed to connect to AI engine.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [section.id]: false }));
    }
  };

  const applyChoice = (sectionId: string, type: 'professional' | 'atsOptimized') => {
    const sugg = activeSuggestions[sectionId];
    if (!sugg) return;
    handleUpdate(sectionId, sugg[type]);
    setActiveSuggestions(prev => ({ ...prev, [sectionId]: null }));
  };

  const discardChoice = (sectionId: string) => {
    setActiveSuggestions(prev => ({ ...prev, [sectionId]: null }));
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (format === 'pdf') await ExportService.generatePdf(currentSections);
    else if (format === 'txt') ExportService.generateTxt(currentSections);
    else await ExportService.generateDocx(currentSections);
    setShowExportMenu(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-40 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Precision Header */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl shadow-indigo-100/50 border sticky top-24 z-40 transition-all">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all px-4 py-2 hover:bg-slate-50 rounded-xl">
          <ArrowLeft size={18} /> Exit Editor
        </button>
        
        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3"
            >
              <Download size={20} /> Download Options
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
                <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 p-4 hover:bg-indigo-50 rounded-2xl transition-colors text-left group">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform"><FileDown size={20} /></div>
                  <div>
                    <div className="text-sm font-black text-slate-800">Adobe PDF</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Optimized Spacing</div>
                  </div>
                </button>
                <button onClick={() => handleExport('docx')} className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 rounded-2xl transition-colors text-left group">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                  <div>
                    <div className="text-sm font-black text-slate-800">Word Document</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Standard Format</div>
                  </div>
                </button>
                <button onClick={() => handleExport('txt')} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform"><Edit3 size={20} /></div>
                  <div>
                    <div className="text-sm font-black text-slate-800">Plain Text</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Pure ATS Data</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-indigo-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black">Interactive AI Editor</h3>
            <p className="text-indigo-100 text-sm font-medium">Refine your content with Gemini. Hold "Compare" to see changes after applying AI updates.</p>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="space-y-14">
        {currentSections.map((section) => {
          const suggestion = activeSuggestions[section.id];
          const isLoading = loadingStates[section.id];
          const isPeeking = peekingIds.has(section.id);
          const hasChanges = section.originalContent && section.content !== section.originalContent;
          const displayContent = isPeeking && section.originalContent ? section.originalContent : section.content;

          return (
            <div key={section.id} className="relative">
              {/* Floating Section Title */}
              <div className="absolute -top-5 left-8 z-10 flex items-center gap-3">
                <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <Edit3 size={14} className="text-indigo-400" /> {section.title}
                </div>
                {isLoading && (
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl text-[10px] font-bold animate-pulse">
                    Refining...
                  </div>
                )}
              </div>

              <div className={`bg-white rounded-[40px] shadow-sm border-2 transition-all duration-300 overflow-hidden ${suggestion ? 'border-indigo-500 ring-8 ring-indigo-50' : isPeeking ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-100' : 'border-slate-100 hover:border-slate-200'}`}>
                <div className="p-10 pt-12">
                  <div className="flex justify-end gap-3 mb-6">
                    {/* Hold to Compare only appears AFTER a suggestion is applied (when content != original and no active suggestion card) */}
                    {hasChanges && !suggestion && (
                      <button 
                        onMouseDown={() => startPeeking(section.id)}
                        onMouseUp={() => stopPeeking(section.id)}
                        onMouseLeave={() => stopPeeking(section.id)}
                        onTouchStart={() => startPeeking(section.id)}
                        onTouchEnd={() => stopPeeking(section.id)}
                        className="select-none flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-amber-100 hover:text-amber-700 transition-all active:scale-95 border border-slate-200"
                        title="Hold to see your original text"
                      >
                        <Eye size={14} /> Hold to Compare
                      </button>
                    )}
                    <button 
                      onClick={() => handleImproveRequest(section)}
                      disabled={isLoading}
                      className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Refine Further</>}
                    </button>
                  </div>

                  {suggestion ? (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                       <div className="grid md:grid-cols-2 gap-8">
                        <div 
                          className="group/card flex flex-col p-8 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-500 hover:shadow-2xl transition-all cursor-pointer relative"
                          onClick={() => applyChoice(section.id, 'professional')}
                        >
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg self-start mb-4">Professional</span>
                          <p className="text-sm text-slate-700 leading-relaxed font-serif italic">{suggestion.professional}</p>
                        </div>
                        <div 
                          className="group/card flex flex-col p-8 rounded-3xl border-2 border-slate-100 bg-emerald-50/30 hover:bg-white hover:border-emerald-500 hover:shadow-2xl transition-all cursor-pointer relative"
                          onClick={() => applyChoice(section.id, 'atsOptimized')}
                        >
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg self-start mb-4">ATS Optimized</span>
                          <p className="text-sm text-slate-700 leading-relaxed font-serif italic">{suggestion.atsOptimized}</p>
                        </div>
                      </div>
                      <button onClick={() => discardChoice(section.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 mx-auto block">Cancel Optimization</button>
                    </div>
                  ) : (
                    <textarea
                      className={`w-full min-h-[220px] p-0 bg-transparent border-0 focus:ring-0 outline-none font-serif leading-relaxed text-2xl resize-none placeholder:text-slate-200 transition-all ${isPeeking ? 'text-slate-500' : 'text-slate-800'}`}
                      value={displayContent}
                      readOnly={isPeeking}
                      onChange={(e) => handleUpdate(section.id, e.target.value)}
                      placeholder="Document section content..."
                      spellCheck={false}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
