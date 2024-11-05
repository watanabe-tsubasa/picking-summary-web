interface FileNamesListProps {
  files: File[] | null;
  errorMessage: string | null;
  children?: string
}

export const FileNamesList: React.FC<FileNamesListProps> = ({
  files, 
  errorMessage,
  children
}) => {
  return (
    <div className='min-h-24 flex flex-col justify-center items-center min-w-full'>
      {files ? (
        <ul>
          {files.map((file, i) => <li key={i}>{file.name}</li>)}
        </ul>
      ) : (
        <p>{children}</p>
      )}
      {errorMessage && (
        <p className="text-red-500 text-center pt-2">{errorMessage}</p>
      )}
    </div>
  )
}