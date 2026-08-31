import React from 'react';
import { JasperAppProvider, useJasperApp } from './JasperAppContext';
import { JasperModalProvider, useJasperModals } from './JasperModalContext';
import { JasperChatProvider, useJasperChat } from './JasperChatContext';

export function JasperProvider({ children }) {
  return (
    <JasperAppProvider>
      <JasperModalProvider>
        <JasperChatProvider>
          {children}
        </JasperChatProvider>
      </JasperModalProvider>
    </JasperAppProvider>
  );
}

export {
  JasperAppProvider,
  useJasperApp,
  JasperModalProvider,
  useJasperModals,
  JasperChatProvider,
  useJasperChat
};
