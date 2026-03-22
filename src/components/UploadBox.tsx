import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileAudio } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
}

export function UploadBox({ onFileSelect }: UploadBoxProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxFiles: 1
  });

  const handleProcess = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">ফাইল আপলোড করুন</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">অডিও বা ভিডিও ফাইল নির্বাচন করুন</p>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div
          {...getRootProps()}
          className={cn(
            "flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
            isDragActive 
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
              : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
            selectedFile ? "border-solid border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10" : ""
          )}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="flex flex-col items-center text-center z-10 w-full">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FileAudio className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 truncate w-full max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full justify-center">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={handleProcess}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  প্রসেস করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center z-10">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all duration-300 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
                আপলোড করতে ক্লিক করুন অথবা টেনে আনুন
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                অডিও বা ভিডিও ফাইল (সর্বোচ্চ ৫০ মেগাবাইট)
              </p>
            </div>
          )}
          
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
