
import React from 'react';
import { AnalysisResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { CheckCircle, XCircle, Award, Target, Layout, Edit3 } from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onEdit: () => void;
  onOpenMatch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ result, onEdit, onOpenMatch }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-8 rounded-3xl shadow-sm border flex flex-col items-center justify-center">
          <ScoreGauge score={result.overallScore} label="Overall ATS Score" size={180} />
          <p className="mt-4 text-xs text-center text-slate-400">Based on industry standards and parsing compatibility.</p>
        </div>
        
        <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-sm border grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Layout className="text-blue-500"/>} label="Sections" value={result.sectionsFound.length} />
          <StatCard icon={<Target className="text-red-500"/>} label="Missing Keywords" value={result.missingKeywords.length} />
          <StatCard icon={<XCircle className="text-amber-500"/>} label="Format Issues" value={result.formattingIssues.length} />
          <StatCard icon={<Award className="text-emerald-500"/>} label="Skills Found" value={result.skills.length} />
          
          <div className="col-span-full pt-4 flex gap-4">
            <button 
              onClick={onEdit}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Edit3 size={18} /> Open Interactive Editor
            </button>
            <button 
              onClick={onOpenMatch}
              className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-indigo-400 transition-all"
            >
              Match Job Description
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Findings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-500" /> Key Strengths
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 bg-green-50 p-3 rounded-xl border border-green-100">{s}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="text-red-500" /> Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-slate-600 bg-red-50 p-3 rounded-xl border border-red-100">{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Keywords & Issues */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4">Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.map((kw, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4">Formatting Issues</h3>
            <ul className="space-y-2">
              {result.formattingIssues.length > 0 ? result.formattingIssues.map((f, i) => (
                <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {f}
                </li>
              )) : (
                <p className="text-sm text-green-600 font-medium">Great job! No major formatting issues found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
    <div className="mb-2">{icon}</div>
    <span className="text-2xl font-black text-slate-800">{value}</span>
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
  </div>
);
