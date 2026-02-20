import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '../primitives/button';
import { cn } from '../lib/cn';

export interface AudioRecorderProps {
  /** Called with WAV blob when recording completes in 'send' mode */
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
  className?: string;
  /** Audio mode: 'send' sends blob immediately, 'transcribe' posts to endpoint and returns text */
  mode?: 'send' | 'transcribe';
  /** Transcription endpoint URL (required when mode='transcribe') */
  transcriptionEndpoint?: string;
  /** Extra headers for transcription request (e.g., Authorization) */
  transcriptionHeaders?: Record<string, string>;
  /** Called with transcribed text when transcription completes */
  onTranscriptionComplete?: (text: string) => void;
  /** Field name for the audio file in the FormData (default: 'file') */
  transcriptionFieldName?: string;
  /** Custom parser for the transcription response — receives the parsed JSON and returns the text.
   *  Default: looks for data.text || data.transcript || data.transcription */
  parseTranscriptionResponse?: (data: unknown) => string;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataLength = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function createWorkletUrl(): string {
  const code = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._stopped = false;
    this.port.onmessage = (e) => {
      if (e.data === 'stop') this._stopped = true;
    };
  }
  process(inputs) {
    if (this._stopped) return false;
    const input = inputs[0];
    if (input && input[0]) {
      this.port.postMessage(new Float32Array(input[0]));
    }
    return true;
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;
  const blob = new Blob([code], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

export function AudioRecorder({
  onRecordingComplete,
  disabled,
  className,
  mode = 'send',
  transcriptionEndpoint,
  transcriptionHeaders,
  onTranscriptionComplete,
  transcriptionFieldName = 'file',
  parseTranscriptionResponse,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workletUrlRef = useRef<string | null>(null);
  const onTranscriptionCompleteRef = useRef(onTranscriptionComplete);
  onTranscriptionCompleteRef.current = onTranscriptionComplete;

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (workletNodeRef.current) {
        workletNodeRef.current.port.postMessage('stop');
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (workletUrlRef.current) URL.revokeObjectURL(workletUrlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const workletUrl = createWorkletUrl();
      workletUrlRef.current = workletUrl;
      await audioContext.audioWorklet.addModule(workletUrl);

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'recorder-processor');
      workletNodeRef.current = workletNode;
      chunksRef.current = [];

      workletNode.port.onmessage = (e) => {
        if (e.data instanceof Float32Array) {
          chunksRef.current.push(e.data);
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      console.error('Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage('stop');
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    const audioContext = audioContextRef.current;
    let wavBlob: Blob | null = null;
    if (audioContext) {
      const sampleRate = audioContext.sampleRate;

      const totalLength = chunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunksRef.current) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      chunksRef.current = [];

      wavBlob = encodeWav(merged, sampleRate);

      audioContext.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (workletUrlRef.current) {
      URL.revokeObjectURL(workletUrlRef.current);
      workletUrlRef.current = null;
    }

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!wavBlob) return;

    if (mode === 'transcribe' && transcriptionEndpoint) {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append(transcriptionFieldName, wavBlob, 'recording.wav');
      try {
        const res = await fetch(transcriptionEndpoint, {
          method: 'POST',
          headers: transcriptionHeaders,
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();
        const text = parseTranscriptionResponse
          ? parseTranscriptionResponse(data)
          : data.text || data.transcript || data.transcription || (typeof data === 'string' ? data : '');
        if (text) onTranscriptionCompleteRef.current?.(text);
      } catch (err) {
        console.error('Transcription failed:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      onRecordingComplete(wavBlob);
    }
  }, [onRecordingComplete, mode, transcriptionEndpoint, transcriptionHeaders, transcriptionFieldName, parseTranscriptionResponse]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isSupported) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {isRecording && (
        <span className="text-xs text-destructive font-mono animate-pulse">{formatDuration(duration)}</span>
      )}
      {isTranscribing && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', isRecording && 'text-destructive hover:text-destructive')}
        disabled={disabled || isTranscribing}
        onClick={isRecording ? stopRecording : startRecording}
        title={isTranscribing ? 'Transcribing...' : isRecording ? 'Stop recording' : 'Record audio'}
      >
        {isTranscribing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isRecording ? (
          <Square className="size-4 fill-current" />
        ) : (
          <Mic className="size-4" />
        )}
      </Button>
    </div>
  );
}
