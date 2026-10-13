import React from 'react';
import { JasperUserProvider, useJasperUser } from './JasperUserContext';
import { JasperAppProvider, useJasperApp } from './JasperAppContext';
import { JasperModalProvider, useJasperModals } from './JasperModalContext';
import { JasperChatProvider, useJasperChat } from './JasperChatContext';

export function JasperProvider({ children }) {
  return (
    <JasperUserProvider>
      <JasperAppProvider>
        <JasperModalProvider>
          <JasperChatProvider>
            {children}
          </JasperChatProvider>
        </JasperModalProvider>
      </JasperAppProvider>
    </JasperUserProvider>
  );
}

export {
  JasperUserProvider,
  useJasperUser,
  JasperAppProvider,
  useJasperApp,
  JasperModalProvider,
  useJasperModals,
  JasperChatProvider,
  useJasperChat
};

