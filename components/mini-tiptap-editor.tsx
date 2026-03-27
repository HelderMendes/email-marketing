'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Unlink,
    Code,
    Code2,
    Image as ImageIcon,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

type MiniTiptapEditorProps = {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
};

export function MiniTiptapEditor({
    content,
    onChange,
    placeholder = 'Enter content...',
    className = '',
}: MiniTiptapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                blockquote: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                horizontalRule: false,
            }),
            TextStyle,
            Color,
            ImageExtension.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    style: 'max-width: 100%; height: auto;',
                },
            }),
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
        ],
        content: content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[60px] p-2',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
    }, [editor]);

    if (!editor) {
        return (
            <div
                className={`border rounded-md bg-gray-50 animate-pulse h-[100px] ${className}`}
            />
        );
    }

    return (
        <div className={`border rounded-md overflow-hidden ${className}`}>
            {/* Mini Toolbar */}
            <div className='flex items-center gap-0.5 p-1 border-b bg-gray-50 flex-wrap'>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title='Bold'
                >
                    <Bold className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title='Italic'
                >
                    <Italic className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    title='Underline'
                >
                    <UnderlineIcon className='h-3.5 w-3.5' />
                </Button>

                <div className='w-px h-4 bg-gray-300 mx-1' />

                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('left').run()
                    }
                    title='Align Left'
                >
                    <AlignLeft className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('center').run()
                    }
                    title='Align Center'
                >
                    <AlignCenter className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('right').run()
                    }
                    title='Align Right'
                >
                    <AlignRight className='h-3.5 w-3.5' />
                </Button>

                <div className='w-px h-4 bg-gray-300 mx-1' />

                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title='Inline Code'
                >
                    <Code className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
                    onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                    }
                    title='Code Block'
                >
                    <Code2 className='h-3.5 w-3.5' />
                </Button>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-7 w-7 p-0'
                    onClick={addImage}
                    title='Add Image'
                >
                    <ImageIcon className='h-3.5 w-3.5' />
                </Button>

                <div className='w-px h-4 bg-gray-300 mx-1' />

                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={`h-7 w-7 p-0 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
                    onClick={setLink}
                    title='Add Link'
                >
                    <LinkIcon className='h-3.5 w-3.5' />
                </Button>
                {editor.isActive('link') && (
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-7 w-7 p-0'
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        title='Remove Link'
                    >
                        <Unlink className='h-3.5 w-3.5' />
                    </Button>
                )}
            </div>

            {/* Editor Content */}
            <div className='bg-white'>
                <EditorContent
                    editor={editor}
                    className='[&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:p-2 [&_.ProseMirror]:text-sm'
                />
                {editor.isEmpty && (
                    <div className='absolute top-[42px] left-2 text-gray-400 text-sm pointer-events-none'>
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MiniTiptapEditor;
