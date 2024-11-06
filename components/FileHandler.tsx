'use client'

import { useState } from 'react';
import FileDropZone from './FileDropZone';
import UploadDialog from './UploadDialog';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const FileHandler = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const processing = async () => {
    if (!files) return;

    setIsProcessing(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/processor', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('ファイルの処理に失敗しました')

      const blob = await res.blob()
      const downloadURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = '処理結果.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();

      setFiles(null);
      setIsDialogOpen(false);
    } catch (error) {
      setIsProcessing(false)
      setErrorMessage('ファイルのアップロード中にエラーが発生しました')
      console.log(error)
    }
    setIsProcessing(false);
  }

  const onOpenChange = () => {
    setIsDialogOpen(!isDialogOpen);
  }

  const validateFiles = async (files: File[]) => {
    const getExtension = (file: File) => {
      return file.name.split('.').pop()?.toLowerCase()
    }
    const extensions = files.map(file => getExtension(file));
    if (extensions.every(ext => ext === 'xlsx')) {
      setErrorMessage(null);
    } else {
      setErrorMessage('XLSXファイル以外を削除しました');
    }
    setFiles(files.filter(file => getExtension(file) === 'xlsx'))
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <FileDropZone
       files={files}
       errorMessage={errorMessage}
       validateFiles={validateFiles}
       setIsDialogOpen={setIsDialogOpen}
      />
      <div className="flex flex-row items-center justify-center w-full">
        <UploadDialog
         files={files}
         errorMessage={errorMessage}
         open={isDialogOpen}
         onOpenChange={onOpenChange}
         onClickProcess={processing}
         isProcessing={isProcessing}
        />
        {files && 
          <Button
           className='min-w-96'
           onClick={processing}
           disabled={isProcessing}>
            {isProcessing ?
              <div>
                {"  "}
                <Loader2 className='animate-spin' />
                {"  "}
              </div>:
              'キャンセルしたのは間違いだったのでやはり処理を行う'
            }
          </Button>
        }
      </div>
    </div>
  );
};

export default FileHandler;
