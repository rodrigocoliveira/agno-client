import { createContext, useContext } from 'react';
import type { RefObject } from 'react';
import type { FileAttachment } from '../../types';

export type AttachmentsContext = {
  files: (FileAttachment & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export type TextInputContext = {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
};

export type PromptInputControllerProps = {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  __registerFileInput: (ref: RefObject<HTMLInputElement | null>, open: () => void) => void;
};

export const PromptInputController = createContext<PromptInputControllerProps | null>(null);
export const ProviderAttachmentsContext = createContext<AttachmentsContext | null>(null);
export const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

export const usePromptInputController = () => {
  const ctx = useContext(PromptInputController);
  if (!ctx) {
    throw new Error('Wrap your component inside <PromptInputProvider> to use usePromptInputController().');
  }
  return ctx;
};

export const useOptionalPromptInputController = () => useContext(PromptInputController);

export const useProviderAttachments = () => {
  const ctx = useContext(ProviderAttachmentsContext);
  if (!ctx) {
    throw new Error('Wrap your component inside <PromptInputProvider> to use useProviderAttachments().');
  }
  return ctx;
};

export const useOptionalProviderAttachments = () => useContext(ProviderAttachmentsContext);

export const usePromptInputAttachments = () => {
  const provider = useOptionalProviderAttachments();
  const local = useContext(LocalAttachmentsContext);
  const context = provider ?? local;
  if (!context) {
    throw new Error('usePromptInputAttachments must be used within a PromptInput or PromptInputProvider');
  }
  return context;
};

export type DropZoneContextValue = {
  isDraggingOver: boolean;
};

export const DropZoneContext = createContext<DropZoneContextValue>({ isDraggingOver: false });

export const usePromptInputDropZone = () => useContext(DropZoneContext);
