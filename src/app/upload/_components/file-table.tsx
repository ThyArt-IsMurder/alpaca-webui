'use client';

import { useState, type FC } from 'react';
import { Spinner } from '@/components/spinner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TFile } from '@/db/schema';
import { formatBytes } from '@/lib/utils';
import { ChatBubbleIcon, DotsVerticalIcon, FileTextIcon, TrashIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiDialog } from '@/components/ui/multiDialog';
import { toast } from 'sonner';
import { type OpenPopovers } from '@/lib/types';
import { useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';

type FileTableProps = {
  files: TFile[];
  filesLoading: boolean;
  isEmbedding: boolean;
  fileIdEmbedding: number | null;
  onEmbedDocument: (documentId: number) => void;
  initConversationWithDocument: (
    documentId: number,
    filename: string,
    embeddingModel: string,
    embeddingServiceId: string
  ) => void;
  reload: () => void;
};

type Modals = 'details' | 'delete';

const FileTable: FC<FileTableProps> = ({
  files,
  filesLoading,
  isEmbedding,
  fileIdEmbedding,
  onEmbedDocument,
  initConversationWithDocument,
  reload,
}) => {
  const [openPopovers, setOpenPopovers] = useState<OpenPopovers>({});
  const [removingFile, setRemovingFile] = useState<boolean>();

  const trpc = useTRPC();
  const removeDocumentMutation = useMutation(
    trpc.document.remove.mutationOptions({
      onSuccess: async (data, variables) => {
        const { documentId } = variables;

        toast.success('Document removed successfully.');

        handleOpenChange(documentId, false);
        reload();
        setTimeout(() => {
          setRemovingFile(false);
        }, 800);
      },
      onError: (error) => {
        toast.error(`Error deleting document: ${error.message}`);
        setRemovingFile(false);
      },
    })
  );

  const handleOpenChange = (id: number, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [id.toString()]: open }));
  };

  const removeDocument = async (documentId: number) => {
    setRemovingFile(true);
    removeDocumentMutation.mutate({ documentId });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80%]">Document</TableHead>
          <TableHead className="w-[20%] text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell>
              <span className="flex">
                <FileTextIcon className="mr-2 h-4 w-4 shrink-0" />
                {file.filename}
              </span>
              {file.isEmbedded && (
                <span className="italic">
                  Embedded with {file.embedApiServiceName}, <strong>{file.embedModel}</strong>
                </span>
              )}
            </TableCell>
            <TableCell className="flex h-auto items-center justify-end gap-2 text-right text-xs">
              {!file.isEmbedded && (
                <Button size={'sm'} onClick={() => onEmbedDocument(file.id)} disabled={isEmbedding}>
                  {fileIdEmbedding == file.id && <Spinner />}
                  {fileIdEmbedding == file.id ? 'Embedding...' : 'Embedd'}
                </Button>
              )}

              <MultiDialog<Modals>>
                {(mdb) => (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="bg-secondary rounded-lg p-2">
                        <DotsVerticalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="right" className="rounded-lg">
                        {file.isEmbedded && (
                          <DropdownMenuItem
                            onClick={() => {
                              initConversationWithDocument(
                                file.id,
                                file.filename,
                                file.embedModel ?? '',
                                file.embedApiServiceName ?? ''
                              );
                            }}
                          >
                            <ChatBubbleIcon className="me-2" />
                            Interact with
                          </DropdownMenuItem>
                        )}
                        <mdb.Trigger value="details">
                          <DropdownMenuItem>
                            <InfoCircledIcon className="me-2" /> View details
                          </DropdownMenuItem>
                        </mdb.Trigger>
                        <mdb.Trigger value="delete">
                          <DropdownMenuItem>
                            <TrashIcon className="me-2" /> Delete
                          </DropdownMenuItem>
                        </mdb.Trigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <mdb.Container value="details">
                      <Dialog>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="pb-2 text-xl">
                              File details for <span className="font-semibold italic">{file.filename}</span>
                            </DialogTitle>
                            <DialogDescription></DialogDescription>
                          </DialogHeader>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Filename</TableCell>
                                <TableCell>{file.filename}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">File Size</TableCell>
                                <TableCell>{formatBytes(file.fileSize ?? 0)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Upload Date</TableCell>
                                <TableCell>{file.timestamp}</TableCell>
                              </TableRow>
                              {file.isEmbedded && (
                                <>
                                  <TableRow>
                                    <TableCell className="font-medium">Api</TableCell>
                                    <TableCell>{file.embedApiServiceName}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Embed Model</TableCell>
                                    <TableCell>{file.embedModel}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Characters</TableCell>
                                    <TableCell>{file.textCharacterCount}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Chunks</TableCell>
                                    <TableCell>{file.noOfChunks}</TableCell>
                                  </TableRow>
                                  {(file.noOfTokens ?? 0) > 0 && (
                                    <TableRow>
                                      <TableCell className="font-medium">Tokens</TableCell>
                                      <TableCell>{file.noOfTokens}</TableCell>
                                    </TableRow>
                                  )}
                                </>
                              )}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
                    </mdb.Container>

                    <mdb.Container value="delete">
                      <Dialog open={openPopovers[file.id] || false} onOpenChange={(open) => handleOpenChange(file.id, open)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. Are you sure you want to permanently delete this file and its
                              embeddings?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              disabled={removingFile}
                              onClick={() => {
                                removeDocument(file.id);
                              }}
                            >
                              {removingFile && <Spinner color="" />}
                              {removingFile ? 'Removing...' : 'Confirm'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </mdb.Container>
                  </>
                )}
              </MultiDialog>
            </TableCell>
          </TableRow>
        ))}
        {filesLoading && (
          <TableRow key="loading">
            <TableCell>
              <Skeleton className="h-3 w-full rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3 w-full rounded-full" />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default FileTable;
