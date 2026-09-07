import React, { useState } from 'react';
import { FileText, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Attachment } from '@/types';

interface FileAttachmentPreviewProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

export const FileAttachmentPreview: React.FC<FileAttachmentPreviewProps> = ({
  attachments,
  onRemove,
  readOnly = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 py-2">
        {attachments.map((att) => (
          <motion.div
            key={att.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
              att.type === 'image'
                ? 'bg-blue-50/70 border-blue-200/60 text-blue-900'
                : 'bg-emerald-50/70 border-emerald-200/60 text-emerald-900'
            }`}
          >
            {/* Thumbnail or File Icon */}
            {att.type === 'image' && att.previewUrl ? (
              <div
                onClick={() => setSelectedImage(att.previewUrl || null)}
                className="relative w-8 h-8 rounded-lg overflow-hidden border border-blue-300/60 cursor-pointer shrink-0"
                title="Click to preview image"
              >
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-3 h-3 text-white" />
                </div>
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            )}

            {/* Meta */}
            <div className="min-w-0 max-w-[160px]">
              <p className="text-xs font-medium truncate leading-tight">{att.name}</p>
              <p className="text-[10px] opacity-60">{formatSize(att.size)}</p>
            </div>

            {/* Remove button */}
            {!readOnly && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(att.id);
                }}
                className="p-1 ml-0.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-contain max-h-[85vh]"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FileAttachmentPreview;
