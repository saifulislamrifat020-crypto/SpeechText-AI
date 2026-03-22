import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Mic, Check, Copy, Sparkles, Loader2, FileText, Globe, Upload, Link as LinkIcon, RefreshCw, ZoomIn, ZoomOut, Languages, Volume2, Wand2, AudioLines, Download } from 'lucide-react';
import { cn } from './lib/utils';
import { transcribeAudio, transcribeUrl, translateToBengali, getBengaliPronunciation, fixTextErrors } from './services/geminiService';
import { UploadBox } from './components/UploadBox';
import { RecordAudio } from './components/RecordAudio';
import { PasteLink } from './components/PasteLink';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'link'>('upload');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const [isFixing, setIsFixing] = useState(false);
  
  const [bengaliPronunciation, setBengaliPronunciation] = useState('');
  const [isGettingPronunciation, setIsGettingPronunciation] = useState(false);
  const [copiedPronunciation, setCopiedPronunciation] = useState(false);
  
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video' | null>(null);
  const [textSize, setTextSize] = useState<number>(18);
  
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (status === 'processing' || status === 'success') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [status]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleProcessAudio = async (fileOrBlob: File | Blob, mimeType: string) => {
    setStatus('processing');
    setErrorMsg('');
    
    const url = URL.createObjectURL(fileOrBlob);
    setMediaUrl(url);
    setMediaType(mimeType.startsWith('video') ? 'video' : 'audio');
    
    try {
      const base64Data = await fileToBase64(fileOrBlob);
      const result = await transcribeAudio(base64Data, mimeType);
      
      setTranscription(result.text);
      setLanguage(result.language);
      
      setStatus('success');
      
      // Fetch pronunciation in the background
      setIsGettingPronunciation(true);
      getBengaliPronunciation(result.text)
        .then(pronunciation => setBengaliPronunciation(pronunciation))
        .catch(err => console.error("Failed to get pronunciation", err))
        .finally(() => setIsGettingPronunciation(false));
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ট্রান্সক্রিপশনের সময় একটি ত্রুটি হয়েছে।");
      setStatus('error');
    }
  };

  const handleProcessUrl = async (url: string) => {
    setStatus('processing');
    setErrorMsg('');
    
    setMediaUrl(null);
    setMediaType(null);
    
    try {
      const result = await transcribeUrl(url);
      
      setTranscription(result.text);
      setLanguage(result.language);
      
      setStatus('success');
      
      // Fetch pronunciation in the background
      setIsGettingPronunciation(true);
      getBengaliPronunciation(result.text)
        .then(pronunciation => setBengaliPronunciation(pronunciation))
        .catch(err => console.error("Failed to get pronunciation", err))
        .finally(() => setIsGettingPronunciation(false));
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ট্রান্সক্রিপশনের সময় একটি ত্রুটি হয়েছে।");
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(showTranslation ? translatedText : transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPronunciation = () => {
    navigator.clipboard.writeText(bengaliPronunciation);
    setCopiedPronunciation(true);
    setTimeout(() => setCopiedPronunciation(false), 2000);
  };

  const handleTranslate = async () => {
    if (translatedText) {
      setShowTranslation(!showTranslation);
      return;
    }
    
    setIsTranslating(true);
    try {
      const translated = await translateToBengali(transcription);
      setTranslatedText(translated);
      setShowTranslation(true);
    } catch (err: any) {
      console.error(err);
      alert("অনুবাদ করতে সমস্যা হয়েছে।");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFixText = async () => {
    setIsFixing(true);
    try {
      const textToFix = showTranslation ? translatedText : transcription;
      const corrected = await fixTextErrors(textToFix);
      if (showTranslation) {
        setTranslatedText(corrected);
      } else {
        setTranscription(corrected);
      }
    } catch (err: any) {
      console.error(err);
      alert("লেখা সংশোধন করতে সমস্যা হয়েছে।");
    } finally {
      setIsFixing(false);
    }
  };

  const reset = () => {
    setStatus('idle');
    setTranscription('');
    setLanguage('');
    setTranslatedText('');
    setShowTranslation(false);
    setBengaliPronunciation('');
    if (mediaUrl && mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
    setMediaType(null);
    setTextSize(18);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <AudioLines className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Bangla Transcriber AI</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ইন্সটল অ্যাপ</span>
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 pt-12 pb-24 w-full">
        <div className="pt-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
              কথাকে টেক্সটে রূপান্তর করুন <span className="text-blue-600 dark:text-blue-400">নিমিষেই</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              অডিও, ভিডিও আপলোড করুন, আপনার ভয়েস রেকর্ড করুন অথবা লিংক পেস্ট করে অ্যাডভান্সড এআই-এর মাধ্যমে কয়েক সেকেন্ডে নির্ভুল টেক্সট পান।
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl p-1.5 shadow-inner overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('upload')}
                className={cn(
                  "flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === 'upload'
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Upload className="w-4 h-4" />
                <span>ফাইল আপলোড</span>
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={cn(
                  "flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === 'record'
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Mic className="w-4 h-4" />
                <span>ভয়েস রেকর্ড</span>
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={cn(
                  "flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === 'link'
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <LinkIcon className="w-4 h-4" />
                <span>লিংক পেস্ট</span>
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto min-h-[360px]">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <UploadBox onFileSelect={(file) => handleProcessAudio(file, file.type)} />
                </motion.div>
              )}
              {activeTab === 'record' && (
                <motion.div
                  key="record"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <RecordAudio onRecordingComplete={(blob) => handleProcessAudio(blob, 'audio/webm')} />
                </motion.div>
              )}
              {activeTab === 'link' && (
                <motion.div
                  key="link"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <PasteLink onSubmit={handleProcessUrl} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div ref={resultsRef} className="mt-8">
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center max-w-2xl mx-auto"
              >
                {errorMsg}
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pt-16 pb-8 flex flex-col items-center justify-center"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold mb-2">আপনার অডিও প্রসেস করা হচ্ছে...</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                  আমাদের এআই কন্টেন্টটি ট্রান্সক্রাইব করছে, ভাষা শনাক্ত করছে এবং একটি সারাংশ তৈরি করছে। এতে সাধারণত কয়েক সেকেন্ড সময় লাগে।
                </p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 space-y-6"
              >
                {mediaUrl && (
                  <div className="w-full max-w-3xl mx-auto mb-6">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls className="w-full rounded-2xl shadow-sm bg-black max-h-80" />
                    ) : (
                      <audio src={mediaUrl} controls className="w-full" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center whitespace-nowrap">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
                    ট্রান্সক্রিপশন ফলাফল
                  </h2>
                  <button
                    onClick={reset}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="রিফ্রেশ করুন"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-full space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">শনাক্তকৃত ভাষা: </span>
                        <strong className="text-slate-900 dark:text-slate-100">{language || 'অজানা'}</strong>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 sm:pr-4 sm:mr-2">
                          <button onClick={() => setTextSize(s => Math.max(12, s - 2))} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="ছোট করুন">
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <span className="text-xs sm:text-sm font-medium w-6 text-center">{textSize}</span>
                          <button onClick={() => setTextSize(s => Math.min(40, s + 2))} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="বড় করুন">
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={handleFixText}
                          disabled={isFixing}
                          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent"
                          title="ভুল সংশোধন করুন"
                        >
                          {isFixing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">সংশোধন</span>
                        </button>
                        <button
                          onClick={handleTranslate}
                          disabled={isTranslating}
                          className={cn(
                            "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border",
                            showTranslation 
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent"
                          )}
                          title="বাংলা অনুবাদ"
                        >
                          {isTranslating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Languages className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{showTranslation ? 'মূল লেখা' : 'বাংলা অনুবাদ'}</span>
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                          onClick={handleCopy}
                          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="কপি করুন"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex-1">
                      <p 
                        className="leading-relaxed whitespace-pre-wrap transition-all duration-200"
                        style={{ fontSize: `${textSize}px` }}
                      >
                        {showTranslation ? translatedText : transcription}
                      </p>
                    </div>
                  </div>
                  
                  {/* Pronunciation Board */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mt-6">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <Volume2 className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">বাংলা উচ্চারণ</span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={handleCopyPronunciation}
                          disabled={isGettingPronunciation || !bengaliPronunciation}
                          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="কপি করুন"
                        >
                          {copiedPronunciation ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex-1 min-h-[100px]">
                      {isGettingPronunciation ? (
                        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>উচ্চারণ তৈরি করা হচ্ছে...</span>
                        </div>
                      ) : bengaliPronunciation ? (
                        <p 
                          className="leading-relaxed whitespace-pre-wrap transition-all duration-200 text-slate-700 dark:text-slate-300"
                          style={{ fontSize: `${Math.max(14, textSize - 2)}px` }}
                        >
                          {bengaliPronunciation}
                        </p>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic text-center">
                          উচ্চারণ পাওয়া যায়নি।
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

