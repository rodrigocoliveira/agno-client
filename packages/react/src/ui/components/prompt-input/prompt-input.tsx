import { cn } from '../../lib/cn';
import type { FileAttachment } from '../../types';
import { InputGroup } from '../../primitives/input-group';
import type { ChangeEventHandler, FormEvent, FormEventHandler, HTMLAttributes } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AttachmentsContext } from './context';
import { LocalAttachmentsContext, useOptionalPromptInputController } from './context';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type PromptInputMessage = {
  text?: string;
  files?: FileAttachment[];
};

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onError'> & {
  accept?: string;
  multiple?: boolean;
  globalDrop?: boolean;
  syncHiddenInput?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (err: { code: 'max_files' | 'max_file_size' | 'accept'; message: string }) => void;
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export const PromptInput = ({
  className,
  accept,
  multiple,
  globalDrop,
  syncHiddenInput,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [items, setItems] = useState<(FileAttachment & { id: string })[]>([]);
  const files = usingProvider ? controller.attachments.files : items;

  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === '') return true;
      const patterns = accept.split(',').map((p) => p.trim()).filter(Boolean);
      for (const pattern of patterns) {
        if (pattern.endsWith('/*')) {
          const prefix = pattern.slice(0, -1);
          if (f.type.startsWith(prefix)) return true;
        } else if (pattern.startsWith('.')) {
          const ext = f.name.toLowerCase().split('.').pop();
          if (ext && `.${ext}` === pattern.toLowerCase()) return true;
        } else if (f.type === pattern) {
          return true;
        }
      }
      return false;
    },
    [accept],
  );

  const addLocal = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = Array.from(fileList);
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({ code: 'accept', message: 'No files match the accepted types.' });
        return;
      }
      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true);
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({ code: 'max_file_size', message: 'All files exceed the maximum size.' });
        return;
      }

      setItems((prev) => {
        const capacity = typeof maxFiles === 'number' ? Math.max(0, maxFiles - prev.length) : undefined;
        const capped = typeof capacity === 'number' ? sized.slice(0, capacity) : sized;
        if (typeof capacity === 'number' && sized.length > capacity) {
          onError?.({ code: 'max_files', message: 'Too many files. Some were not added.' });
        }
        const next: (FileAttachment & { id: string })[] = [];
        for (const file of capped) {
          next.push({
            id: generateId(),
            type: 'file',
            url: URL.createObjectURL(file),
            mediaType: file.type,
            filename: file.name,
          });
        }
        return prev.concat(next);
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError],
  );

  const add = usingProvider
    ? (fileList: File[] | FileList) => controller.attachments.add(fileList)
    : addLocal;

  const remove = usingProvider
    ? (id: string) => controller.attachments.remove(id)
    : (id: string) =>
        setItems((prev) => {
          const found = prev.find((file) => file.id === id);
          if (found?.url) URL.revokeObjectURL(found.url);
          return prev.filter((file) => file.id !== id);
        });

  const clear = usingProvider
    ? () => controller.attachments.clear()
    : () =>
        setItems((prev) => {
          for (const file of prev) if (file.url) URL.revokeObjectURL(file.url);
          return [];
        });

  const openFileDialog = usingProvider
    ? () => controller.attachments.openFileDialog()
    : openFileDialogLocal;

  useEffect(() => {
    if (!usingProvider) return;
    controller.__registerFileInput(inputRef, () => inputRef.current?.click());
  }, [usingProvider, controller]);

  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) {
      inputRef.current.value = '';
    }
  }, [files, syncHiddenInput]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files);
    };
    form.addEventListener('dragover', onDragOver);
    form.addEventListener('drop', onDrop);
    return () => {
      form.removeEventListener('dragover', onDragOver);
      form.removeEventListener('drop', onDrop);
    };
  }, [add]);

  useEffect(() => {
    if (!globalDrop) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files);
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [add, globalDrop]);

  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(
    () => () => {
      if (!usingProvider) {
        for (const f of filesRef.current) if (f.url) URL.revokeObjectURL(f.url);
      }
    },
    [usingProvider],
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.currentTarget.files) add(event.currentTarget.files);
  };

  const convertBlobUrlToDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const ctx = useMemo<AttachmentsContext>(
    () => ({
      files: files.map((item) => ({ ...item, id: item.id })),
      add,
      remove,
      clear,
      openFileDialog,
      fileInputRef: inputRef,
    }),
    [files, add, remove, clear, openFileDialog],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const text = usingProvider
      ? controller.textInput.value
      : (() => {
          const formData = new FormData(form);
          return (formData.get('message') as string) || '';
        })();

    if (!usingProvider) form.reset();

    Promise.all(
      files.map(async ({ id, ...item }) => {
        if (item.url && item.url.startsWith('blob:')) {
          return { ...item, url: await convertBlobUrlToDataUrl(item.url) };
        }
        return item;
      }),
    ).then((convertedFiles: FileAttachment[]) => {
      try {
        const result = onSubmit({ text, files: convertedFiles }, event);
        if (result instanceof Promise) {
          result
            .then(() => {
              clear();
              if (usingProvider) controller.textInput.clear();
            })
            .catch(() => {});
        } else {
          clear();
          if (usingProvider) controller.textInput.clear();
        }
      } catch {
        // Don't clear on error
      }
    });
  };

  const inner = (
    <form className={cn('w-full', className)} onSubmit={handleSubmit} ref={formRef} {...props}>
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <InputGroup>{children}</InputGroup>
    </form>
  );

  return usingProvider ? inner : <LocalAttachmentsContext.Provider value={ctx}>{inner}</LocalAttachmentsContext.Provider>;
};
