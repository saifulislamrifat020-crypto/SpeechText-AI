import { useState } from 'react';
import { Link as LinkIcon, ArrowRight } from 'lucide-react';

interface PasteLinkProps {
  onSubmit: (url: string) => void;
}

export function PasteLink({ onSubmit }: PasteLinkProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">লিংক পেস্ট করুন</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">যেকোনো অডিও বা ভিডিও লিংক দিন</p>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center relative overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6 z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <LinkIcon className="w-8 h-8" />
            </div>
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
              ট্রান্সক্রাইব করতে একটি লিংক দিন
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="block w-full pl-11 pr-4 py-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              <span>ট্রান্সক্রাইব করুন</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </form>
        
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent dark:from-purple-500/10 opacity-50 pointer-events-none" />
      </div>
    </div>
  );
}
