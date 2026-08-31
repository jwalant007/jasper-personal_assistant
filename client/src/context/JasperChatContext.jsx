import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const JasperChatContext = createContext(null);

export function JasperChatProvider({ children }) {
  // Past Chat History
  const [pastChats, setPastChats] = useState(() => {
    const saved = localStorage.getItem('jasper_past_chats');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        query: 'who is narendra modi', 
        response: 'Narendra Damodardas Modi is an Indian politician who has served as the prime minister of India since 2014. Modi was the chief minister of Gujarat from 2001 to 2014 and is the member of parliament for Varanasi. He is a member of the Bharatiya Janata Party and of the Rashtriya Swayamsevak Sangh, a right-wing Hindutva paramilitary volunteer organisation. He is the longest-serving prime minister outside the Indian National Congress. Modi was born and raised in Vadnagar, Bombay State, where he completed his secondary education. He was introduced to the RSS at the age of eight, becoming a full-time worker for the organisation in Gujarat in 1971. The RSS assigned him to the BJP in 1985, and he rose through the party hierarchy, becoming general secretary in 1998. In 2001, Modi was appointed chief minister of Gujarat and elected to the legislative assembly soon after.', 
        timestamp: new Date().toLocaleString() 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('jasper_past_chats', JSON.stringify(pastChats));
  }, [pastChats]);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const addPastChat = useCallback((chat) => {
    const newEntry = {
      id: chat.id || Date.now(),
      query: chat.query,
      response: chat.response,
      attachments: chat.attachments || [],
      timestamp: chat.timestamp || new Date().toLocaleString()
    };
    setPastChats(prev => [newEntry, ...prev]);
    setSelectedChatId(newEntry.id);
    return newEntry;
  }, []);

  const clearChatHistory = useCallback(() => {
    localStorage.removeItem('jasper_past_chats');
    setPastChats([]);
    setSelectedChatId(null);
  }, []);

  const processFiles = useCallback((files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} is too large (>20MB).`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf';
      const isText = file.type.startsWith('text/') || 
                     /\.(js|jsx|ts|tsx|json|csv|py|md|html|css|c|cpp|h|java|txt|log|xml|yaml|yml|sh|ps1)$/i.test(file.name);

      const reader = new FileReader();

      if (isText) {
        reader.onload = (e) => {
          const textContent = e.target.result;
          setPendingAttachments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              isText: true,
              textContent: textContent,
              icon: '📄'
            }
          ]);
        };
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const base64 = dataUrl.split(',')[1] || '';
          
          let icon = '📁';
          if (isImage) icon = '🖼️';
          else if (isAudio) icon = '🎵';
          else if (isPdf) icon = '📕';

          setPendingAttachments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              name: file.name,
              type: file.type || (isImage ? 'image/png' : 'application/octet-stream'),
              size: file.size,
              dataUrl: dataUrl,
              base64: base64,
              isImage,
              isAudio,
              isPdf,
              icon
            }
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const handleRemoveAttachment = useCallback((id) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  const value = {
    pastChats,
    setPastChats,
    selectedChatId,
    setSelectedChatId,
    manualInput,
    setManualInput,
    pendingAttachments,
    setPendingAttachments,
    isDraggingOver,
    setIsDraggingOver,
    lightboxImage,
    setLightboxImage,
    addPastChat,
    clearChatHistory,
    processFiles,
    handleRemoveAttachment,
    clearAttachments
  };

  return (
    <JasperChatContext.Provider value={value}>
      {children}
    </JasperChatContext.Provider>
  );
}

export function useJasperChat() {
  const context = useContext(JasperChatContext);
  if (!context) {
    throw new Error('useJasperChat must be used within a JasperChatProvider');
  }
  return context;
}
