import React, { useState } from 'react';
import { UploadIcon } from '@radix-ui/react-icons';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelected, fileInputRef }) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files.length == 1) {
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelected(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      fileInputRef.current?.click();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="flex">
      <div
        role="button"
        tabIndex={0}
        className={`my-3 flex h-28 w-full flex-col items-center justify-center rounded-lg border p-3 ${dragging ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-700 bg-zinc-800'} hover:border-zinc-800 hover:bg-zinc-900`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center">
          <UploadIcon />
          <span className="text-center text-xl xl:text-2xl">
            Drag and drop or <u>select document</u>
          </span>
        </div>
        <div className="text-sm text-slate-500 italic">.pdf, .txt, .docx</div>
      </div>
    </section>
  );
};
