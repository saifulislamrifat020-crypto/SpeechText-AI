import { useState, useEffect } from 'react';
import { Mic, AlertCircle, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecordAudioProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function RecordAudio({ onRecordingComplete }: RecordAudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error accessing microphone", err);
      if (err.name === 'NotAllowedError' || err.message.includes('Permission dismissed')) {
        setError("মাইক্রোফোনের অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে মাইক্রোফোনের অনুমতি দিন এবং আবার চেষ্টা করুন।");
      } else if (err.name === 'NotFoundError') {
        setError("কোনো মাইক্রোফোন পাওয়া যায়নি। অনুগ্রহ করে একটি মাইক্রোফোন সংযুক্ত করুন এবং আবার চেষ্টা করুন।");
      } else {
        setError("মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে আপনার ব্রাউজারের অনুমতিগুলো চেক করুন।");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">ভয়েস রেকর্ড করুন</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">সরাসরি মাইক্রোফোন থেকে রেকর্ড করুন</p>
      </div>
      <div className="p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="mb-8 text-center z-10">
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">
            {isRecording ? "রেকর্ডিং চলছে..." : "রেকর্ড শুরু করতে বাটনে ক্লিক করুন"}
          </p>
          <div className="h-8 mt-2">
            {isRecording && (
              <p className="text-3xl font-mono font-bold text-red-500 animate-pulse">
                {formatTime(recordingTime)}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 z-10",
            isRecording 
              ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" 
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          )}
        >
          {isRecording ? (
            <Square className="w-8 h-8 fill-current" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />
              <span className="absolute inset-[-16px] rounded-full border-4 border-red-500 animate-ping opacity-10" style={{ animationDelay: '0.2s' }} />
            </>
          )}
        </button>
        
        {isRecording && (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 z-10">
            থামাতে স্কয়ার বাটনে ক্লিক করুন
          </p>
        )}

        {error && (
          <div className="mt-6 flex items-start space-x-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/50 max-w-sm text-left z-10">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent dark:from-blue-500/10 opacity-50 pointer-events-none" />
      </div>
    </div>
  );
}
