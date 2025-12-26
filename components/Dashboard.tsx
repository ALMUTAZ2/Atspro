
import React from 'react';
import { AnalysisResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { 
  ShieldAlert, 
  Binary, 
  Target, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Edit3, 
  FileSearch,
  Zap
} from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onEdit: () => void;
  onOpenMatch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ result, onEdit, onOpenMatch }) => {
  const metricRatio = result.metrics.totalBulletPoints > 0 
    ? (result.metrics.bulletsWithMetrics / result.metrics.totalBulletPoints) * 100 
    : 0;

  const isCritical = result.criticalErrors.length > 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Forensic Verdict Header */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
          <ScoreGauge score={result.overallScore || 0} label="Compliance Index" size={180} />
          <div className="mt-6 text-center z-10">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Diagnostic Status</span>
            <div className={`text-sm font-bold mt-1 ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isCritical ? 'CRITICAL FAILURE' : 'COMPLIANT'}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-6">
              <Binary size={14} /> PROPHET V4.1 Forensic Kernel
            </div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4 italic">
              "{result.summaryFeedback}"
            </h2>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inferred Role</p>
                <p className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Target size={18} className="text-indigo-500" /> {result.detectedRole}
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sections Found</p>
                <p className="text-lg font-black text-slate-800">{result.metrics.sectionCount}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-10">
            <button 
              onClick={onEdit}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Edit3 size={18} /> Inject Metrics
            </button>
            <button 
              onClick={onOpenMatch}
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.5rem] font-black hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-[0.98]"
            >
              Cross-Match JD
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Protocol 1: Keyword Gaps */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileSearch size={16} /> Technical Delta
          </h3>
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase mb-3 tracking-tighter">Detected Hard Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {result.hardSkillsFound.slice(0, 12).map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">{s}</span>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black text-rose-500 uppercase mb-3 tracking-tighter">Missing Industry Standards</p>
              <div className="flex flex-wrap gap-1.5">
                {result.missingHardSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Protocol 2: Impact Audit */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={16} /> Impact Audit
          </h3>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative mb-6">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" className="stroke-slate-100 fill-none" strokeWidth="8" />
                <circle 
                  cx="64" cy="64" r="58" 
                  className="stroke-indigo-500 fill-none transition-all duration-1000" 
                  strokeWidth="8" 
                  strokeDasharray={364.42} 
                  strokeDashoffset={364.42 - (364.42 * metricRatio) / 100} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{Math.round(metricRatio)}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Density</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <MetricItem label="Total Bullets" value={result.metrics.totalBulletPoints} />
              <MetricItem label="Metric-Dense" value={result.metrics.bulletsWithMetrics} color="text-emerald-600" />
              <MetricItem label="Weak Verbs" value={result.metrics.weakVerbsCount} color="text-rose-600" />
            </div>
          </div>
        </div>

        {/* Protocol 3: Compliance Gates */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldAlert size={16} /> Compliance Gates
          </h3>
          <div className="space-y-4 flex-1">
            {result.criticalErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <AlertOctagon className="text-rose-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-bold text-rose-900 leading-snug">{err}</p>
              </div>
            ))}
            {result.formattingIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Zap className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-bold text-amber-900 leading-snug">{issue}</p>
              </div>
            ))}
            {result.criticalErrors.length === 0 && result.formattingIssues.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Structural Integrity Optimal</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem = ({ label, value, color = "text-slate-800" }: { label: string, value: number, color?: string }) => (
  <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);
