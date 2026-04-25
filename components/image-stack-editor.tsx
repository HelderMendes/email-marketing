'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Trash2,
    GripVertical,
    Upload,
    Link as LinkIcon,
} from 'lucide-react';

export type ImageItem = {
    id: string;
    src: string;
    link: string;
};

type ImageStackEditorProps = {
    images: ImageItem[];
    onChange: (images: ImageItem[]) => void;
    defaultLink?: string;
};

export function ImageStackEditor({
    images,
    onChange,
    defaultLink = 'https://lookoutmode.nl',
}: ImageStackEditorProps) {
    const [uploading, setUploading] = useState<string | null>(null);

    const addImage = useCallback(() => {
        const newImage: ImageItem = {
            id: `img-${Date.now()}`,
            src: '',
            link: defaultLink,
        };
        onChange([...images, newImage]);
    }, [images, onChange, defaultLink]);

    const removeImage = useCallback(
        (id: string) => {
            onChange(images.filter((img) => img.id !== id));
        },
        [images, onChange],
    );

    const updateImage = useCallback(
        (id: string, field: 'src' | 'link', value: string) => {
            onChange(
                images.map((img) =>
                    img.id === id ? { ...img, [field]: value } : img,
                ),
            );
        },
        [images, onChange],
    );

    const handleImageUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(imageId);

            try {
                const response = await fetch(
                    `/api/upload?filename=${file.name}`,
                    {
                        method: 'POST',
                        body: file,
                    },
                );

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                if (result.url) {
                    updateImage(imageId, 'src', result.url);
                }
            } catch (err) {
                console.error('Upload error:', err);
                alert('Failed to upload image');
            } finally {
                setUploading(null);
                if (e.target) e.target.value = '';
            }
        },
        [updateImage],
    );

    const moveImage = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (toIndex < 0 || toIndex >= images.length) return;
            const newImages = [...images];
            const [moved] = newImages.splice(fromIndex, 1);
            newImages.splice(toIndex, 0, moved);
            onChange(newImages);
        },
        [images, onChange],
    );

    return (
        <div className='space-y-4'>
            {images.length === 0 ? (
                <div className='text-center py-12 border-2 border-dashed rounded-lg bg-gray-50'>
                    <p className='text-gray-500 mb-4'>No images yet</p>
                    <Button onClick={addImage} variant='outline'>
                        <Plus className='h-4 w-4 mr-2' />
                        Add First Image
                    </Button>
                </div>
            ) : (
                <div className='space-y-3'>
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className='border rounded-lg p-4 bg-white shadow-sm'
                        >
                            <div className='flex items-start gap-3'>
                                {/* Drag handle & order */}
                                <div className='flex flex-col items-center gap-1 pt-2'>
                                    <GripVertical className='h-5 w-5 text-gray-400' />
                                    <span className='text-xs text-gray-400 font-medium'>
                                        {index + 1}
                                    </span>
                                    <div className='flex flex-col gap-1 mt-2'>
                                        <button
                                            onClick={() =>
                                                moveImage(index, index - 1)
                                            }
                                            disabled={index === 0}
                                            className='text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30'
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() =>
                                                moveImage(index, index + 1)
                                            }
                                            disabled={
                                                index === images.length - 1
                                            }
                                            className='text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30'
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>

                                {/* Image preview/upload */}
                                <div className='flex-1 space-y-3'>
                                    {image.src ? (
                                        <div className='relative group'>
                                            <img
                                                src={image.src}
                                                alt={`Image ${index + 1}`}
                                                className='w-full rounded-md border'
                                            />
                                            <label className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md'>
                                                <span className='text-white text-sm font-medium'>
                                                    Replace Image
                                                </span>
                                                <input
                                                    type='file'
                                                    accept='image/*'
                                                    onChange={(e) =>
                                                        handleImageUpload(
                                                            e,
                                                            image.id,
                                                        )
                                                    }
                                                    className='hidden'
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className='flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50'>
                                            {uploading === image.id ? (
                                                <span className='text-sm text-gray-500'>
                                                    Uploading...
                                                </span>
                                            ) : (
                                                <>
                                                    <Upload className='h-8 w-8 text-gray-400 mb-2' />
                                                    <span className='text-sm text-gray-500'>
                                                        Click to upload image
                                                    </span>
                                                </>
                                            )}
                                            <input
                                                type='file'
                                                accept='image/*'
                                                onChange={(e) =>
                                                    handleImageUpload(
                                                        e,
                                                        image.id,
                                                    )
                                                }
                                                className='hidden'
                                                disabled={
                                                    uploading === image.id
                                                }
                                            />
                                        </label>
                                    )}

                                    {/* Link input */}
                                    <div className='flex items-center gap-2'>
                                        <LinkIcon className='h-4 w-4 text-gray-400 shrink-0' />
                                        <Input
                                            type='url'
                                            placeholder='https://lookoutmode.nl/...'
                                            value={image.link}
                                            onChange={(e) =>
                                                updateImage(
                                                    image.id,
                                                    'link',
                                                    e.target.value,
                                                )
                                            }
                                            className='flex-1 text-sm'
                                        />
                                    </div>
                                </div>

                                {/* Delete button */}
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => removeImage(image.id)}
                                    className='text-red-500 hover:text-red-700 hover:bg-red-50'
                                >
                                    <Trash2 className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {images.length > 0 && (
                <Button onClick={addImage} variant='outline' className='w-full'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Another Image
                </Button>
            )}
        </div>
    );
}

// Convert images array to HTML for email
export function imagesToHtml(images: ImageItem[]): string {
    if (images.length === 0) return '';

    return images
        .filter((img) => img.src) // Only include images with a source
        .map((img) => {
            const linkStart = img.link
                ? `<a href="${img.link}" target="_blank" style="display: block; text-decoration: none;">`
                : '';
            const linkEnd = img.link ? '</a>' : '';

            return `${linkStart}<img src="${img.src}" alt="" style="width: 100%; display: block; border: 0;" />${linkEnd}`;
        })
        .join('\n');
}

// Parse HTML back to images array (for editing existing campaigns)
export function htmlToImages(html: string): ImageItem[] {
    if (!html || html.trim() === '') return [];

    const images: ImageItem[] = [];

    // Match both linked and unlinked images
    const imgRegex =
        /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*\/?>\s*<\/a>|<img[^>]*src="([^"]*)"[^>]*\/?>/gi;

    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const link = match[1] || '';
        const src = match[2] || match[3] || '';

        if (src) {
            images.push({
                id: `img-${Date.now()}-${images.length}`,
                src,
                link: link || 'https://lookoutmode.nl',
            });
        }
    }

    return images;
}
