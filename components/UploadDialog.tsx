import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileNamesList } from "./atoms";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface UploadDialogProps {
  files: File[] | null;
  errorMessage: string | null;
  open: boolean;
  onOpenChange: () => void;
  onClickProcess: () => void;
  isProcessing: boolean
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  files,
  errorMessage,
  open,
  onOpenChange,
  onClickProcess,
  isProcessing
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このエクセルファイルを処理してよろしいでしょうか?</AlertDialogTitle>
          <AlertDialogDescription>
            確認してから実行ボタンを押してください
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FileNamesList
         files={files}
         errorMessage={errorMessage}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            やめる
          </AlertDialogCancel>
          <Button
           className="min-w-36"
           onClick={onClickProcess}
           disabled={isProcessing}
          >
            {isProcessing ?
              <Loader2 className='animate-spin' />:
              '処理する'
            }
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default UploadDialog;