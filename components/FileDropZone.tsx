'use client'

import { SetStateAction, useCallback, useState } from 'react';
import { FileNamesList } from './atoms';

interface FileDropZoneProps {
  files: File[] | null;
  errorMessage: string | null;
  validateFiles: (files: File[]) => void;
  setIsDialogOpen: React.Dispatch<SetStateAction<boolean>>;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  files,
  errorMessage,
  validateFiles,
  setIsDialogOpen
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsHovered(true);
    console.log('File Hovered');
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsHovered(false);
    console.log('File Drop Cancelled');
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsHovered(false);

    const updatedFiles = Array.from(event.dataTransfer.files)
    if (!updatedFiles) return
    
    validateFiles(updatedFiles);
    setIsDialogOpen(true)

    const paths = updatedFiles.map(file => file.name);
    console.log('File Dropped:', paths);
  }, [validateFiles, setIsDialogOpen]);

  return (
    <div
      className={`border-2 border-dashed px-10 py-4 text-center w-full transition-colors ${
        isHovered ? 'border-gray-500 bg-gray-100' : 'border-gray-300'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <FileNamesList
       files={files}
       errorMessage={errorMessage}
      >
        ここにファイルをドラッグ＆ドロップしてください
      </FileNamesList>
    </div>
  );
};

export default FileDropZone;
