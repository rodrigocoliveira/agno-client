import type { PropsWithChildren, RefObject } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { FileAttachment } from '../../types';
import type { AttachmentsContext, PromptInputControllerProps } from './context';
import { PromptInputController, ProviderAttachmentsContext } from './context';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string;
}>;

export function PromptInputProvider({ initialInput: initialTextInput = '', children }: PromptInputProviderProps) {
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(''), []);

  const [fileItems, setFileItems] = useState<(FileAttachment & { id: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openRef = useRef<() => void>(() => {});

  const add = useCallback((files: File[] | FileList) => {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    setFileItems((prev) =>
      prev.concat(
        incoming.map((file) => ({
          id: generateId(),
          type: 'file' as const,
          url: URL.createObjectURL(file),
          mediaType: file.type,
          filename: file.name,
        })),
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setFileItems((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setFileItems((prev) => {
      for (const f of prev) if (f.url) URL.revokeObjectURL(f.url);
      return [];
    });
  }, []);

  const openFileDialog = useCallback(() => {
    openRef.current?.();
  }, []);

  const attachments = useMemo<AttachmentsContext>(
    () => ({
      files: fileItems,
      add,
      remove,
      clear,
      openFileDialog,
      fileInputRef,
    }),
    [fileItems, add, remove, clear, openFileDialog],
  );

  const __registerFileInput = useCallback(
    (ref: RefObject<HTMLInputElement | null>, open: () => void) => {
      fileInputRef.current = ref.current;
      openRef.current = open;
    },
    [],
  );

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      textInput: { value: textInput, setInput: setTextInput, clear: clearInput },
      attachments,
      __registerFileInput,
    }),
    [textInput, clearInput, attachments, __registerFileInput],
  );

  return (
    <PromptInputController.Provider value={controller}>
      <ProviderAttachmentsContext.Provider value={attachments}>{children}</ProviderAttachmentsContext.Provider>
    </PromptInputController.Provider>
  );
}
