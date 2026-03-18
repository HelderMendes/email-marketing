'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    Unlink,
    Heading1,
    Heading2,
    Code,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

export function TiptapEditor({
    content,
    onChange,
}: {
    content: string;
    onChange: (html: string) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [isSourceMode, setIsSourceMode] = useState(false);

    const extensions = useMemo(
        () => [
            StarterKit,
            TextStyle,
            Color,
            Underline,
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                },
            }),
            ImageExtension.configure({
                inline: true,
                allowBase64: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        [],
    );

    const editor = useEditor({
        extensions,
        immediatelyRender: false,
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
    }, [editor]);

    const handleImageUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;

            setUploading(true);

            try {
                const response = await fetch(
                    `/api/upload?filename=${file.name}`,
                    {
                        method: 'POST',
                        body: file,
                    },
                );

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'No error text');
                    throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
                }

                const responseText = await response.text();
                if (!responseText) {
                    throw new Error('Empty response from server');
                }

                const newBlob = JSON.parse(responseText);

                if (newBlob.url) {
                    editor.chain().focus().setImage({ src: newBlob.url }).run();
                } else {
                    alert('Upload failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading image');
            } finally {
                setUploading(false);
                if (e.target) e.target.value = ''; // Reset input safely
            }
        },
        [editor],
    );

    const toggleSourceMode = useCallback(() => {
        if (!editor) return;
        if (isSourceMode) {
            editor.commands.setContent(content);
            setIsSourceMode(false);
        } else {
            setIsSourceMode(true);
        }
    }, [editor, isSourceMode, content]);

    if (!editor) {
        return null;
    }

    return (
        <div className='border rounded-md bg-white shadow-sm'>
            <div className='flex gap-1 p-2 border-b bg-gray-50 flex-wrap items-center sticky top-0 z-10'>
                {/* Text Formatting Group */}
                <div className='flex gap-1 border-r pr-2 mr-2'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                        title='Bold'
                    >
                        <Bold className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={
                            editor.isActive('italic') ? 'bg-gray-200' : ''
                        }
                        title='Italic'
                    >
                        <Italic className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={
                            editor.isActive('underline') ? 'bg-gray-200' : ''
                        }
                        title='Underline'
                    >
                        <UnderlineIcon className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                        className={
                            editor.isActive('strike') ? 'bg-gray-200' : ''
                        }
                        title='Strikethrough'
                    >
                        <Strikethrough className='h-4 w-4' />
                    </Button>
                </div>

                {/* Alignment Group */}
                <div className='flex gap-1 border-r pr-2 mr-2'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().setTextAlign('left').run()
                        }
                        className={
                            editor.isActive({ textAlign: 'left' })
                                ? 'bg-gray-200'
                                : ''
                        }
                        title='Align Left'
                    >
                        <AlignLeft className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().setTextAlign('center').run()
                        }
                        className={
                            editor.isActive({ textAlign: 'center' })
                                ? 'bg-gray-200'
                                : ''
                        }
                        title='Align Center'
                    >
                        <AlignCenter className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().setTextAlign('right').run()
                        }
                        className={
                            editor.isActive({ textAlign: 'right' })
                                ? 'bg-gray-200'
                                : ''
                        }
                        title='Align Right'
                    >
                        <AlignRight className='h-4 w-4' />
                    </Button>
                </div>

                {/* Headings */}
                <div className='flex gap-1 border-r pr-2 mr-2'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        className={
                            editor.isActive('heading', { level: 1 })
                                ? 'bg-gray-200'
                                : ''
                        }
                        title='Heading 1'
                    >
                        <Heading1 className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        className={
                            editor.isActive('heading', { level: 2 })
                                ? 'bg-gray-200'
                                : ''
                        }
                        title='Heading 2'
                    >
                        <Heading2 className='h-4 w-4' />
                    </Button>
                </div>

                {/* Lists */}
                <div className='flex gap-1 border-r pr-2 mr-2'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        className={
                            editor.isActive('bulletList') ? 'bg-gray-200' : ''
                        }
                        title='Bullet List'
                    >
                        <List className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        className={
                            editor.isActive('orderedList') ? 'bg-gray-200' : ''
                        }
                        title='Ordered List'
                    >
                        <ListOrdered className='h-4 w-4' />
                    </Button>
                </div>

                {/* Colors */}
                <div className='flex gap-1 border-r pr-2 mr-2 items-center'>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                                title='Text Color'
                            >
                                <Palette
                                    className='h-4 w-4'
                                    style={{
                                        color: editor.getAttributes('textStyle')
                                            .color,
                                    }}
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-64 p-3'>
                            <div className='flex flex-col gap-2'>
                                <Label>Text Color</Label>
                                <div className='flex gap-2 flex-wrap'>
                                    {[
                                        '#000000',
                                        '#333333',
                                        '#666666',
                                        '#ff0000',
                                        '#00ff00',
                                        '#0000ff',
                                        '#f59e0b',
                                        '#8b5cf6',
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() =>
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .setColor(color)
                                                    .run()
                                            }
                                            className={`w-6 h-6 rounded-full border ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-offset-1 ring-black' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type='color'
                                        onChange={(e) =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setColor(e.target.value)
                                                .run()
                                        }
                                        value={
                                            editor.getAttributes('textStyle')
                                                .color || '#000000'
                                        }
                                        className='w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer'
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Media & Links */}
                <div className='flex gap-1'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={setLink}
                        className={editor.isActive('link') ? 'bg-gray-200' : ''}
                        title={
                            editor.isActive('link') ? 'Edit Link' : 'Add Link'
                        }
                    >
                        <LinkIcon className='h-4 w-4' />
                    </Button>
                    {editor.isActive('link') && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                                editor.chain().focus().unsetLink().run()
                            }
                            title='Remove Link'
                        >
                            <Unlink className='h-4 w-4' />
                        </Button>
                    )}

                    <div className='relative inline-block'>
                        <input
                            type='file'
                            accept='image/*'
                            onChange={handleImageUpload}
                            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                            disabled={uploading}
                            title='Upload Image'
                        />
                        <Button
                            variant='ghost'
                            size='sm'
                            disabled={uploading}
                            className={uploading ? 'animate-pulse' : ''}
                        >
                            <ImageIcon className='h-4 w-4' />
                        </Button>
                    </div>

                    <div className='ml-auto pl-2 border-l'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={toggleSourceMode}
                            className={isSourceMode ? 'bg-gray-200' : ''}
                            title='Toggle Source Code'
                        >
                            <Code className='h-4 w-4' />
                        </Button>
                    </div>
                </div>
            </div>
            {isSourceMode ? (
                <textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    className='w-full h-[500px] p-4 font-mono text-sm border-0 focus:outline-none resize-none'
                />
            ) : (
                <EditorContent editor={editor} />
            )}
        </div>
    );
}
