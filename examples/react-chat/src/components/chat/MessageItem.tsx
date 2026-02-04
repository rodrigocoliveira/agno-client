import { Response } from '@/components/ai-elements/response'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { ChatMessage } from '@rodrigocoliveira/agno-types'
import { AlertCircle, Bot, FileIcon, FileText, Image as ImageIcon, Lightbulb, Music, Paperclip, User, Video } from 'lucide-react'
import { GenerativeUIRenderer } from '@rodrigocoliveira/agno-react'
import { Artifact } from '@/components/ai-elements/artifact'

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const hasError = message.streamingError

  // Determine tool state for AI Elements Tool component
  const getToolState = (tool: NonNullable<ChatMessage['tool_calls']>[0]): 'output-available' | 'output-error' => {
    return tool.tool_call_error ? 'output-error' : 'output-available'
  }

  // Extract tool calls with UI components for prominent rendering
  const toolsWithUI = message.tool_calls?.filter((tool) => (tool as any).ui_component) || []

  return (
    <div className={cn(
      "animate-message-in py-5 first:pt-2",
      isUser ? "flex justify-end" : ""
    )}>
      {isUser ? (
        /* User message - right-aligned bubble */
        <div className="flex items-end gap-2.5 max-w-[80%] flex-row-reverse">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="space-y-1.5">
            <div className={cn(
              "rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground",
              hasError && "opacity-70"
            )}>
              {message.content && (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {/* User file attachments */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {message.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/10 px-2 py-1 text-xs">
                      <FileIcon className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 px-1">
              <span className="text-[11px] text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {hasError && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
          </div>
        </div>
      ) : (
        /* Assistant message - left-aligned, full width */
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            {/* Timestamp */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {hasError && (
                <span className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </span>
              )}
            </div>

            {/* Rendered UI Components (from tool calls) */}
            {toolsWithUI.length > 0 && (
              <div className="space-y-3">
                {toolsWithUI.map((tool) => {
                  const uiComponent = (tool as any).ui_component
                  return (
                    <div key={tool.tool_call_id}>
                      {uiComponent.layout === 'artifact' ? (
                        <Artifact>
                          <GenerativeUIRenderer
                            spec={uiComponent}
                            className="w-full p-2"
                          />
                        </Artifact>
                      ) : (
                        <GenerativeUIRenderer
                          spec={uiComponent}
                          className="w-full"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Main Content with Markdown Support */}
            {message.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                <Response>{message.content}</Response>
              </div>
            )}

            {/* Tool Calls */}
            {message.tool_calls && message.tool_calls.length > 0 && (
              <div className="space-y-2 pt-1">
                {message.tool_calls.map((tool, idx) => (
                  <Tool key={tool.tool_call_id || idx} defaultOpen={idx === 0}>
                    <ToolHeader
                      title={tool.tool_name}
                      type="tool-use"
                      state={getToolState(tool)}
                    />
                    <ToolContent>
                      <ToolInput input={tool.tool_args} />
                      {tool.content && (
                        <ToolOutput
                          output={tool.content}
                          errorText={tool.tool_call_error ? 'Tool execution failed' : undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                ))}
              </div>
            )}

            {/* Reasoning Steps */}
            {message.extra_data?.reasoning_steps && message.extra_data.reasoning_steps.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Reasoning ({message.extra_data.reasoning_steps.length} steps)
                </div>
                <Accordion type="multiple" className="w-full">
                  {message.extra_data.reasoning_steps.map((step, idx) => (
                    <AccordionItem key={idx} value={`reasoning-${idx}`} className="border-muted">
                      <AccordionTrigger className="text-xs py-1.5 hover:no-underline">
                        {step.title || `Step ${idx + 1}`}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-1.5 text-xs text-muted-foreground">
                        {step.action && <div><span className="font-medium text-foreground">Action:</span> {step.action}</div>}
                        {step.reasoning && <div><span className="font-medium text-foreground">Reasoning:</span> {step.reasoning}</div>}
                        {step.result && <div><span className="font-medium text-foreground">Result:</span> {step.result}</div>}
                        {step.confidence !== undefined && <div><span className="font-medium text-foreground">Confidence:</span> {(step.confidence * 100).toFixed(1)}%</div>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* References */}
            {message.extra_data?.references && message.extra_data.references.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  References ({message.extra_data.references.length})
                </div>
                <div className="space-y-2">
                  {message.extra_data.references.map((refData, idx) => (
                    <div key={idx} className="text-xs space-y-1.5">
                      {refData.query && (
                        <div className="font-medium text-foreground">Query: {refData.query}</div>
                      )}
                      {refData.references.map((ref, refIdx) => (
                        <div key={refIdx} className="bg-muted/50 border border-border p-2.5 rounded-lg">
                          <div className="italic text-muted-foreground mb-1">"{ref.content}"</div>
                          <div className="text-muted-foreground/70">
                            Source: {ref.name} (chunk {ref.meta_data.chunk}/{ref.meta_data.chunk_size})
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images ({message.images.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {message.images.map((img, idx) => (
                    <div key={idx} className="space-y-1">
                      <img
                        src={img.url}
                        alt={img.revised_prompt || 'Generated image'}
                        className="w-full rounded-lg border border-border"
                      />
                      {img.revised_prompt && (
                        <p className="text-[11px] text-muted-foreground italic px-0.5">{img.revised_prompt}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {message.videos && message.videos.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Video className="h-3.5 w-3.5" />
                  Videos ({message.videos.length})
                </div>
                <div className="space-y-2">
                  {message.videos.map((video, idx) => (
                    <div key={idx}>
                      {video.url ? (
                        <video src={video.url} controls className="w-full rounded-lg border border-border" />
                      ) : (
                        <div className="bg-muted/50 border border-border p-2.5 rounded-lg text-xs text-muted-foreground">
                          Video ID: {video.id} (ETA: {video.eta}s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {message.audio && message.audio.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Music className="h-3.5 w-3.5" />
                  Audio ({message.audio.length})
                </div>
                <div className="space-y-2">
                  {message.audio.map((audio, idx) => (
                    <div key={idx}>
                      {audio.url ? (
                        <audio src={audio.url} controls className="w-full" />
                      ) : audio.base64_audio ? (
                        <audio
                          src={`data:${audio.mime_type || 'audio/wav'};base64,${audio.base64_audio}`}
                          controls
                          className="w-full"
                        />
                      ) : (
                        <div className="bg-muted/50 border border-border p-2.5 rounded-lg text-xs text-muted-foreground">Audio data unavailable</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Attachments */}
            {message.files && message.files.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  Files ({message.files.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      {file.size && (
                        <span className="text-muted-foreground/70">
                          ({(file.size / 1024).toFixed(1)}KB)
                        </span>
                      )}
                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Audio (TTS) */}
            {message.response_audio && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Music className="h-3.5 w-3.5" />
                  Response Audio
                </div>
                {message.response_audio.transcript && (
                  <div className="text-xs italic bg-muted/50 border border-border p-2.5 rounded-lg text-muted-foreground">
                    "{message.response_audio.transcript}"
                  </div>
                )}
                {message.response_audio.content && (
                  <audio
                    src={`data:audio/wav;base64,${message.response_audio.content}`}
                    controls
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
