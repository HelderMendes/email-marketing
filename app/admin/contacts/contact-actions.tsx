'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

import { CreateContactDialog } from './create-contact-dialog';

export function ContactActions() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setProcessing(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Use XMLHttpRequest to track upload progress
            const xhr = new XMLHttpRequest();

            const promise = new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete =
                            (event.loaded / event.total) * 100;
                        setUploadProgress(percentComplete);
                        if (percentComplete === 100) {
                            setProcessing(true);
                        }
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.statusText || 'Upload failed'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error'));
                });

                xhr.open('POST', '/api/contacts/import');
                xhr.send(formData);
            });

            const result: any = await promise;

            alert(
                `Import Complete!\n\n` +
                    `Total Rows: ${result.total}\n` +
                    `Imported (New): ${result.imported}\n` +
                    `Skipped (Duplicates): ${result.skipped}`,
            );
            window.location.reload();
        } catch (error: any) {
            console.error('Import error:', error);
            alert(`Failed to import contacts: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setProcessing(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className='flex items-center gap-2'>
            <CreateContactDialog />

            <Dialog
                open={isUploading}
                onOpenChange={(open) => !open && setIsUploading(false)}
            >
                <DialogContent
                    className='sm:max-w-md'
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Importing Contacts</DialogTitle>
                        <DialogDescription>
                            Please wait while we process your file.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='flex flex-col gap-4 py-4'>
                        <div className='flex justify-between text-sm text-gray-500'>
                            <span>
                                {processing
                                    ? 'Processing on server...'
                                    : 'Uploading...'}
                            </span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className='w-full' />
                        {processing && (
                            <p className='text-xs text-center text-muted-foreground animate-pulse'>
                                Parsing CSV and checking for duplicates...
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className='relative'>
                <input
                    type='file'
                    accept='.csv'
                    onChange={handleFileUpload}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    disabled={isUploading}
                />
                <Button variant='outline' disabled={isUploading}>
                    <Upload className='mr-2 h-4 w-4' />
                    {isUploading ? 'Importing...' : 'Import CSV'}
                </Button>
            </div>
            <Button variant='outline' asChild>
                <a href='/api/contacts/export' download>
                    <Download className='mr-2 h-4 w-4' />
                    Export CSV
                </a>
            </Button>
        </div>
    );
}
