import { cn } from '../../lib/cn';
import { MicIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PromptInputButton } from './buttons';
import { useOptionalPromptInputController } from './context';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

type SpeechRecognitionResultList = {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export type PromptInputSpeechButtonProps = ComponentProps<typeof PromptInputButton> & {
  onTranscriptionChange?: (text: string) => void;
  lang?: string;
};

export const PromptInputSpeechButton = ({
  className,
  onTranscriptionChange,
  lang = 'en-US',
  ...props
}: PromptInputSpeechButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptionChangeRef = useRef(onTranscriptionChange);
  onTranscriptionChangeRef.current = onTranscriptionChange;
  const controller = useOptionalPromptInputController();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognitionCtor();

      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = lang;

      speechRecognition.onstart = () => setIsListening(true);
      speechRecognition.onend = () => setIsListening(false);

      speechRecognition.onresult = (event) => {
        let finalTranscript = '';
        const results = Array.from(event.results);
        for (const result of results) {
          if (result.isFinal) finalTranscript += result[0]?.transcript ?? '';
        }
        if (finalTranscript) {
          if (controller) {
            const current = controller.textInput.value;
            const newValue = current + (current ? ' ' : '') + finalTranscript;
            controller.textInput.setInput(newValue);
          }
          onTranscriptionChangeRef.current?.(finalTranscript);
        }
      };

      speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = speechRecognition;
      setRecognition(speechRecognition);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [lang]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    if (isListening) recognition.stop();
    else recognition.start();
  }, [recognition, isListening]);

  return (
    <PromptInputButton
      className={cn(
        'relative transition-all duration-200',
        isListening && 'animate-pulse bg-accent text-accent-foreground',
        className,
      )}
      disabled={!recognition}
      onClick={toggleListening}
      {...props}
    >
      <MicIcon className="size-4" />
    </PromptInputButton>
  );
};
