'use client';

import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";

interface responseType {
  success: boolean;
  message: string;
}

interface FetchButtonProps {
  children: string | ReactNode;
}

export const FetchButton: React.FC<FetchButtonProps> = ({ children }) => {
  const [results, setResults] = useState<responseType[]>([]);
  const fetcher = async () => {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "tagName": "JavaScript"
      })
    });
    const data = await res.json() as responseType;
    if (data.success)  setResults([...results, data])
  }

  return(
    <div>
      <Button onClick={fetcher}>{children}</Button>
      <div>
        {results.map(elem => elem.message)}
      </div>
    </div>
  )
}