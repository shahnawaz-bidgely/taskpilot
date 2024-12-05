import React, { createContext, useState } from 'react';

export const FileContext = createContext();

export function FileProvider({ children }) {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileContent, setFileContent] = useState(null);
  
    React.useEffect(() => {
      console.log('Uploaded File Updated in Context:', uploadedFile);
      console.log('File Content Updated in Context:', fileContent);
    }, [uploadedFile, fileContent]);
  
    return (
      <FileContext.Provider value={{ uploadedFile, fileContent, setUploadedFile, setFileContent }}>
        {children}
      </FileContext.Provider>
    );
  }
  