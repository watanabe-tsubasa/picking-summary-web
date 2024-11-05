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
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setFiles(null);
      setIsDialogOpen(false);
    }, 1000)
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
