import { useState, useEffect, useCallback, useRef } from 'react'
import { useAgnoKnowledge } from '@rodrigocoliveira/agno-react'
import { ContentResponse, VectorSearchResult, KnowledgeConfigResponse } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Database,
  Upload,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  Eye,
  Search,
  Loader2,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Link,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { cn } from '@/lib/utils'

function getFileIcon(type: string | null | undefined) {
  if (!type) return <File className="h-4 w-4" />
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  if (type.includes('json') || type.includes('csv')) return <FileCode className="h-4 w-4 text-green-500" />
  if (type.includes('text')) return <FileText className="h-4 w-4 text-blue-500" />
  return <File className="h-4 w-4" />
}

function formatFileSize(size: string | null | undefined): string {
  if (!size) return '-'
  const bytes = parseInt(size, 10)
  if (isNaN(bytes)) return size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null
  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
    processing: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    failed: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  }
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn("gap-1", config.color)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  )
}

export function KnowledgePage() {
  const {
    content,
    isLoading,
    listContent,
    getConfig,
    uploadContent,
    deleteContent,
    deleteAllContent,
    search,
    getContentStatus,
  } = useAgnoKnowledge()

  const [contentToDelete, setContentToDelete] = useState<string | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [contentDetail, setContentDetail] = useState<ContentResponse | null>(null)

  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadTextContent, setUploadTextContent] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('semantic')
  const [maxResults, setMaxResults] = useState(10)
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Config state
  const [knowledgeConfig, setKnowledgeConfig] = useState<KnowledgeConfigResponse | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)

  // Fetch content on mount
  useEffect(() => {
    listContent()
  }, [listContent])

  const handleRefresh = useCallback(() => {
    listContent()
    toast.success('Content refreshed')
  }, [listContent])

  const handleDelete = useCallback(async () => {
    if (!contentToDelete) return
    setIsDeleting(true)
    try {
      await deleteContent(contentToDelete)
      toast.success('Content deleted')
      setContentToDelete(null)
    } catch (error) {
      toast.error('Failed to delete content')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [contentToDelete, deleteContent])

  const handleDeleteAll = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteAllContent()
      toast.success('All content deleted')
      setShowDeleteAllDialog(false)
    } catch (error) {
      toast.error('Failed to delete all content')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteAllContent])

  const handleViewDetails = useCallback(async (item: ContentResponse) => {
    setContentDetail(item)
    try {
      // Refresh status if processing
      if (item.status === 'processing') {
        const status = await getContentStatus(item.id)
        setContentDetail((prev) => prev ? { ...prev, ...status } : prev)
      }
    } catch (error) {
      console.error(error)
    }
  }, [getContentStatus])

  const handleUpload = useCallback(async () => {
    if (!uploadFile && !uploadUrl && !uploadTextContent) {
      toast.error('Please provide a file, URL, or text content')
      return
    }

    setIsUploading(true)
    try {
      await uploadContent({
        name: uploadName || undefined,
        description: uploadDescription || undefined,
        file: uploadFile || undefined,
        url: uploadUrl || undefined,
        text_content: uploadTextContent || undefined,
      })
      toast.success('Content uploaded successfully')
      setShowUploadDialog(false)
      setUploadFile(null)
      setUploadUrl('')
      setUploadTextContent('')
      setUploadName('')
      setUploadDescription('')
      listContent()
    } catch (error) {
      toast.error('Failed to upload content')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }, [uploadFile, uploadUrl, uploadTextContent, uploadName, uploadDescription, uploadContent, listContent])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsSearching(true)
    try {
      const response = await search({
        query: searchQuery,
        search_type: searchType,
        max_results: maxResults,
      })
      setSearchResults(response.data)
      if (response.data.length === 0) {
        toast.info('No results found')
      }
    } catch (error) {
      toast.error('Search failed')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, searchType, maxResults, search])

  const handleLoadConfig = useCallback(async () => {
    setIsLoadingConfig(true)
    try {
      const config = await getConfig()
      setKnowledgeConfig(config)
    } catch (error) {
      toast.error('Failed to load configuration')
      console.error(error)
    } finally {
      setIsLoadingConfig(false)
    }
  }, [getConfig])

  const columns: Column<ContentResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div className="flex items-center gap-2">
          {getFileIcon(item.type)}
          <span className="font-medium truncate max-w-[200px]">
            {item.name || 'Unnamed'}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.type || '-'}
        </span>
      ),
      className: 'w-[150px]',
    },
    {
      key: 'size',
      header: 'Size',
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatFileSize(item.size)}
        </span>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
      className: 'w-[120px]',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : '-'}
        </span>
      ),
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      header: '',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(item)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setContentToDelete(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-[50px]',
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <PageHeader
          title="Knowledge"
          description="Manage your knowledge base - upload documents, search content, and configure RAG."
          action={
            <div className="flex items-center gap-2">
              {content.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteAllDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="config" onClick={handleLoadConfig}>
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {isLoading && content.length === 0 ? (
              <LoadingState message="Loading content..." />
            ) : content.length === 0 ? (
              <EmptyState
                icon={<Database className="h-6 w-6 text-muted-foreground" />}
                title="No content yet"
                description="Upload documents, text, or URLs to build your knowledge base."
                action={
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                }
              />
            ) : (
              <DataTable
                data={content}
                columns={columns}
                keyExtractor={(item) => item.id}
                onRowClick={handleViewDetails}
              />
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vector Search</CardTitle>
                <CardDescription>
                  Search your knowledge base using semantic or keyword search.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter your search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semantic">Semantic</SelectItem>
                      <SelectItem value="keyword">Keyword</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Max Results: {maxResults}</Label>
                  <Slider
                    value={[maxResults]}
                    onValueChange={([value]) => setMaxResults(value)}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Search Results ({searchResults.length})
                </h4>
                {searchResults.map((result, index) => (
                  <Card key={result.id || index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {result.name || `Result ${index + 1}`}
                        </CardTitle>
                        {result.reranking_score != null && (
                          <Badge variant="secondary">
                            Score: {result.reranking_score.toFixed(3)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {result.content}
                      </p>
                      {result.meta_data && Object.keys(result.meta_data).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {Object.entries(result.meta_data).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {isLoadingConfig ? (
              <LoadingState message="Loading configuration..." />
            ) : !knowledgeConfig ? (
              <EmptyState
                icon={<Settings className="h-6 w-6 text-muted-foreground" />}
                title="Configuration not loaded"
                description="Click to load the knowledge base configuration."
                action={
                  <Button variant="outline" onClick={handleLoadConfig}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Config
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {knowledgeConfig.readers && Object.keys(knowledgeConfig.readers).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Available Readers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(knowledgeConfig.readers).map(([key, reader]) => (
                          <Badge key={key} variant="outline">
                            {reader.name || key}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {knowledgeConfig.chunkers && Object.keys(knowledgeConfig.chunkers).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Available Chunkers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(knowledgeConfig.chunkers).map(([key, chunker]) => (
                          <Badge key={key} variant="outline">
                            {chunker.name || key}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {knowledgeConfig.vector_dbs && knowledgeConfig.vector_dbs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Vector Databases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {knowledgeConfig.vector_dbs.map((db) => (
                          <Badge key={db.id} variant="outline">
                            {db.name || db.id}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Content Dialog */}
      <AlertDialog open={!!contentToDelete} onOpenChange={() => setContentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL content from the knowledge base? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>
              Add content to your knowledge base from a file, URL, or text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="file">
              <TabsList className="w-full">
                <TabsTrigger value="file" className="flex-1">File</TabsTrigger>
                <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
                <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
                    "hover:border-primary/50 transition-colors",
                    uploadFile && "border-primary bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.csv,.json,.txt,.docx,.md"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(uploadFile.type)}
                      <span className="font-medium">{uploadFile.name}</span>
                      <Badge variant="secondary">{formatFileSize(String(uploadFile.size))}</Badge>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, CSV, JSON, TXT, DOCX, MD
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-url">URL</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="upload-url"
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                      className="pl-9"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-text">Text Content</Label>
                  <Textarea
                    id="upload-text"
                    value={uploadTextContent}
                    onChange={(e) => setUploadTextContent(e.target.value)}
                    placeholder="Paste your text content here..."
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-name">Name (optional)</Label>
                <Input
                  id="upload-name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Content name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-description">Description (optional)</Label>
                <Textarea
                  id="upload-description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the content"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || (!uploadFile && !uploadUrl && !uploadTextContent)}
            >
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Detail Sheet */}
      <Sheet open={!!contentDetail} onOpenChange={() => setContentDetail(null)}>
        <SheetContent className="w-[500px] sm:w-[540px] overflow-auto">
          <SheetHeader>
            <SheetTitle>Content Details</SheetTitle>
            <SheetDescription>
              View content information and metadata.
            </SheetDescription>
          </SheetHeader>

          {contentDetail && (
            <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(contentDetail.type)}
                  <div>
                    <h4 className="font-medium">{contentDetail.name || 'Unnamed'}</h4>
                    <p className="text-sm text-muted-foreground">{contentDetail.type || 'Unknown type'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <StatusBadge status={contentDetail.status} />
                  <Badge variant="outline">{formatFileSize(contentDetail.size)}</Badge>
                </div>

                {contentDetail.description && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Description</h4>
                      <p className="text-sm text-muted-foreground">{contentDetail.description}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Details</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {contentDetail.id}
                      </code>
                    </div>
                    {contentDetail.access_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Access Count</span>
                        <span>{contentDetail.access_count}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {contentDetail.created_at
                          ? format(new Date(contentDetail.created_at), 'MMM d, yyyy HH:mm')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>
                        {contentDetail.updated_at
                          ? format(new Date(contentDetail.updated_at), 'MMM d, yyyy HH:mm')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {contentDetail.status_message && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Status Message</h4>
                      <p className="text-sm text-muted-foreground">{contentDetail.status_message}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
