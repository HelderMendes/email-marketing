'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImagePlus, Upload, Loader2, Check, Trash2 } from 'lucide-react';
import Image from 'next/image';

type MediaFile = {
    id: number;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: string;
};

type MediaLibraryProps = {
    onSelect: (url: string) => void;
    trigger?: React.ReactNode;
};

export function MediaLibrary({ onSelect, trigger }: MediaLibraryProps) {
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [urlPreviewError, setUrlPreviewError] = useState(false);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/upload');
            if (res.ok) {
                const data = await res.json();
                setImages(data);
            }
        } catch (error) {
            console.error('Failed to fetch images:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchImages();
        }
    }, [open, fetchImages]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await fetch(
                `/api/upload?filename=${encodeURIComponent(file.name)}`,
                {
                    method: 'POST',
                    body: file,
                },
            );

            if (res.ok) {
                const data = await res.json();
                // Add to local state immediately
                setImages((prev) => [
                    {
                        id: data.mediaFileId || Date.now(),
                        filename: file.name,
                        url: data.url,
                        mimeType: file.type,
                        size: file.size,
                        createdAt: new Date().toISOString(),
                    },
                    ...prev,
                ]);
                setSelectedUrl(data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            setOpen(false);
            setSelectedUrl(null);
        }
    };

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onSelect(urlInput.trim());
            setOpen(false);
            setUrlInput('');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '—';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleDelete = async (image: MediaFile, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete "${image.filename}"?`)) return;

        try {
            const res = await fetch(
                `/api/upload?id=${image.id}&url=${encodeURIComponent(image.url)}`,
                { method: 'DELETE' },
            );
            if (res.ok) {
                setImages((prev) => prev.filter((img) => img.id !== image.id));
                if (selectedUrl === image.url) setSelectedUrl(null);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant='outline' size='sm' className='gap-2'>
                        <ImagePlus className='h-4 w-4' />
                        Add Image
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className='max-w-3xl max-h-[80vh]'>
                <DialogHeader>
                    <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue='library' className='w-full'>
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='library'>Library</TabsTrigger>
                        <TabsTrigger value='upload'>Upload</TabsTrigger>
                        <TabsTrigger value='url'>URL</TabsTrigger>
                    </TabsList>

                    <TabsContent value='library' className='mt-4'>
                        {loading ? (
                            <div className='flex items-center justify-center py-12'>
                                <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                            </div>
                        ) : images.length === 0 ? (
                            <div className='text-center py-12 text-gray-500'>
                                <ImagePlus className='h-12 w-12 mx-auto mb-3 opacity-50' />
                                <p>No images uploaded yet</p>
                                <p className='text-sm'>
                                    Upload your first image to get started
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className='h-[400px]'>
                                <div className='grid grid-cols-4 gap-3 p-1'>
                                    {images.map((image) => (
                                        <div
                                            key={image.id}
                                            onClick={() =>
                                                setSelectedUrl(image.url)
                                            }
                                            className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:shadow-lg ${
                                                selectedUrl === image.url
                                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            {failedImages.has(image.url) ? (
                                                <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                                                    <ImagePlus className='h-8 w-8 text-gray-400' />
                                                </div>
                                            ) : (
                                                <Image
                                                    width={100}
                                                    height={100}
                                                    src={image.url}
                                                    alt={image.filename}
                                                    className='w-full h-full object-cover'
                                                    onError={() =>
                                                        setFailedImages(
                                                            (prev) =>
                                                                new Set(
                                                                    prev,
                                                                ).add(
                                                                    image.url,
                                                                ),
                                                        )
                                                    }
                                                />
                                            )}
                                            {selectedUrl === image.url && (
                                                <div className='absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1'>
                                                    <Check className='h-3 w-3' />
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) =>
                                                    handleDelete(image, e)
                                                }
                                                className='absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                                title='Delete'
                                            >
                                                <Trash2 className='h-3 w-3' />
                                            </button>
                                            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2'>
                                                <p className='text-white text-xs truncate'>
                                                    {image.filename}
                                                </p>
                                                <p className='text-white/70 text-[10px]'>
                                                    {formatFileSize(image.size)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {selectedUrl && (
                            <div className='flex justify-end mt-4 pt-4 border-t'>
                                <Button
                                    onClick={handleSelect}
                                    className='gap-2'
                                >
                                    <Check className='h-4 w-4' />
                                    Insert Image
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value='upload' className='mt-4'>
                        <div className='border-2 border-dashed rounded-lg p-12 text-center'>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleUpload}
                                className='hidden'
                                id='media-upload'
                                disabled={uploading}
                            />
                            <label
                                htmlFor='media-upload'
                                className='cursor-pointer flex flex-col items-center gap-3'
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className='h-12 w-12 text-blue-500 animate-spin' />
                                        <p className='text-gray-600'>
                                            Uploading...
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className='h-12 w-12 text-gray-400' />
                                        <p className='text-gray-600'>
                                            Click to upload an image
                                        </p>
                                        <p className='text-gray-400 text-sm'>
                                            JPG, PNG, GIF up to 10MB
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>

                        {selectedUrl && (
                            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
                                <p className='text-sm text-gray-500 mb-2'>
                                    Uploaded:
                                </p>
                                <div className='flex items-center gap-3'>
                                    <Image
                                        src={selectedUrl}
                                        width={64}
                                        height={64}
                                        alt='Upload'
                                        className='w-16 h-16 object-cover rounded'
                                    />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm truncate'>
                                            {selectedUrl}
                                        </p>
                                    </div>
                                    <Button onClick={handleSelect} size='sm'>
                                        Insert
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value='url' className='mt-4'>
                        <div className='space-y-4'>
                            <div>
                                <Label>Image URL</Label>
                                <Input
                                    type='url'
                                    placeholder='https://example.com/image.jpg'
                                    value={urlInput}
                                    onChange={(e) => {
                                        setUrlInput(e.target.value);
                                        setUrlPreviewError(false);
                                    }}
                                    className='mt-1'
                                />
                            </div>

                            {urlInput && (
                                <div className='p-4 bg-gray-50 rounded-lg'>
                                    <p className='text-sm text-gray-500 mb-2'>
                                        Preview:
                                    </p>
                                    {urlPreviewError ? (
                                        <div className='w-24 h-24 bg-gray-200 rounded flex items-center justify-center'>
                                            <span className='text-gray-500 text-xs'>
                                                Invalid URL
                                            </span>
                                        </div>
                                    ) : (
                                        <Image
                                            src={urlInput}
                                            width={500}
                                            height={500}
                                            alt='Preview'
                                            className='max-h-48 rounded'
                                            onError={() =>
                                                setUrlPreviewError(true)
                                            }
                                            onLoad={() =>
                                                setUrlPreviewError(false)
                                            }
                                        />
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={handleUrlSubmit}
                                disabled={!urlInput.trim()}
                                className='w-full'
                            >
                                Insert Image from URL
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
