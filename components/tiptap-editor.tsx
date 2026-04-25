'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import { Node, mergeAttributes } from '@tiptap/core';
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
    LayoutGrid,
    ImagePlus,
    ShoppingBag,
    Megaphone,
    Sparkles,
    ChevronDown,
    X,
    Trash2,
    Square,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCallback, useState, useEffect, useRef } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { MediaLibrary } from '@/components/media-library';

/**
 * 📝 Teaching note: Extensions must be defined OUTSIDE the component
 * to prevent re-instantiation on each render. TipTap tracks extensions
 * by name, and React Strict Mode's double-render causes "duplicate" warnings
 * when extensions are created inside the component.
 */

/**
 * 📝 Custom Div extension to preserve styled div containers in the editor.
 * This is essential for email templates that use div wrappers with inline styles.
 */
const SectionBlock = Node.create({
    name: 'sectionBlock',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: (element) => element.getAttribute('style'),
                renderHTML: (attributes) => {
                    if (!attributes.style) return {};
                    return { style: attributes.style };
                },
            },
            class: {
                default: null,
                parseHTML: (element) => element.getAttribute('class'),
                renderHTML: (attributes) => {
                    if (!attributes.class) return {};
                    return { class: attributes.class };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[style]',
                priority: 60,
            },
            {
                tag: 'div.section-block',
                priority: 60,
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes), 0];
    },
});

/**
 * 📝 Custom Image extension that preserves style attribute for email compatibility
 */
const CustomImage = ImageExtension.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            style: {
                default: null,
                parseHTML: (element) => element.getAttribute('style'),
                renderHTML: (attributes) => {
                    if (!attributes.style) return {};
                    return { style: attributes.style };
                },
            },
        };
    },
});

/**
 * 📝 Teaching note: TipTap extensions define the editor's capabilities.
 * We're using StarterKit (basics) + extras for rich email editing.
 */
const extensions = [
    StarterKit,
    TextStyle.configure({
        HTMLAttributes: {},
    }),
    Color.configure({
        types: ['textStyle'],
    }),
    FontFamily.configure({
        types: ['textStyle'],
    }),
    Underline,
    SectionBlock,
    LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-blue-500 underline',
        },
    }),
    CustomImage.configure({
        inline: true,
        allowBase64: true,
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
];

type EditorRef = {
    insertBlock: (html: string) => void;
};

// Helper to convert any color format to hex for color picker
function colorToHex(color: string): string {
    if (!color) return '#000000';
    color = color.trim();

    // Already hex
    if (color.startsWith('#')) {
        // Convert shorthand #abc to #aabbcc
        if (color.length === 4) {
            return (
                '#' +
                color[1] +
                color[1] +
                color[2] +
                color[2] +
                color[3] +
                color[3]
            );
        }
        return color;
    }

    // RGB/RGBA format
    const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    // Use browser to convert named colors
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        return ctx.fillStyle; // Returns hex
    }

    return '#000000';
}

// Helper to update a style property in an inline style string
function updateStyleProperty(
    styleStr: string,
    prop: string,
    value: string,
): string {
    const regex = new RegExp(`${prop}:\\s*[^;]+;?`, 'g');
    let newStyle = styleStr.replace(regex, '').trim();
    newStyle = `${prop}: ${value}; ${newStyle}`.trim();
    return newStyle;
}

export function TiptapEditor({
    content,
    onChange,
    onEditorReady,
    minimal = false,
    minHeight = 300,
}: {
    content: string;
    onChange: (html: string) => void;
    onEditorReady?: (ref: EditorRef) => void;
    minimal?: boolean;
    minHeight?: number;
}) {
    const [uploading, setUploading] = useState(false);
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
        src: string;
        alt: string;
        width: string;
        height: string;
        align: 'left' | 'center' | 'right';
        link: string;
        borderRadius: string;
    } | null>(null);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [selectedImagePos, setSelectedImagePos] = useState<number | null>(
        null,
    );
    const [selectedBlock, setSelectedBlock] = useState<{
        backgroundColor: string;
        padding: string;
        margin: string;
        borderRadius: string;
        borderWidth: string;
        borderStyle: string;
        borderColor: string;
        textColor: string;
        element: HTMLElement | null;
    } | null>(null);
    const [showBlockEditor, setShowBlockEditor] = useState(false);

    // Panel positions for draggable panels
    const [blockPanelPos, setBlockPanelPos] = useState({ x: 0, y: 0 });
    const [imagePanelPos, setImagePanelPos] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{
        startX: number;
        startY: number;
        panelX: number;
        panelY: number;
    } | null>(null);
    const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

    // Reset panel positions when panels open
    useEffect(() => {
        if (showBlockEditor) setBlockPanelPos({ x: 0, y: 0 });
    }, [showBlockEditor]);

    useEffect(() => {
        if (showImageEditor) setImagePanelPos({ x: 0, y: 0 });
    }, [showImageEditor]);

    /**
     * 📝 Teaching note: These are "block templates" — pre-built HTML snippets
     * that users can insert. For email compatibility, we use table-based layouts
     * with inline styles (emails don't support external CSS reliably).
     */
    const blocks = {
        hero: `
<div style="text-align: center; padding: 24px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin: 0;">
  <h1 style="color: white; font-size: 32px; margin: 0 0 16px 0;">✨ New Collection</h1>
  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 12px 0;">Discover our latest arrivals</p>
  <a href="#" style="display: inline-block; background: white; color: #764ba2; padding: 12px; border-radius: 25px; text-decoration: none; font-weight: bold;">Shop Now →</a>
</div>`,

        twoColumn: `
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
  <tr>
    <td width="48%" valign="top" style="padding-right: 2%;">
      <img src="https://placehold.co/280x350/e8d5c4/333333?text=Product+1" alt="Product" style="width: 100%; border-radius: 8px;" />
      <p style="text-align: center; margin: 12px 0 4px 0; font-weight: bold;">Product Name</p>
      <p style="text-align: center; margin: 0; color: #666;">€59.00</p>
    </td>
    <td width="48%" valign="top" style="padding-left: 2%;">
      <img src="https://placehold.co/280x350/d4c4b0/333333?text=Product+2" alt="Product" style="width: 100%; border-radius: 8px;" />
      <p style="text-align: center; margin: 12px 0 4px 0; font-weight: bold;">Product Name</p>
      <p style="text-align: center; margin: 0; color: #666;">€79.00</p>
    </td>
  </tr>
</table>`,

        threeColumn: `
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
  <tr>
    <td width="31%" valign="top" style="padding-right: 2%;">
      <img src="https://placehold.co/180x220/e8d5c4/333333?text=Item+1" alt="Product" style="width: 100%; border-radius: 8px;" />
      <p style="text-align: center; margin: 8px 0 2px 0; font-size: 14px; font-weight: bold;">Item Name</p>
      <p style="text-align: center; margin: 0; font-size: 14px; color: #666;">€49.00</p>
    </td>
    <td width="31%" valign="top" style="padding: 0 1%;">
      <img src="https://placehold.co/180x220/d4c4b0/333333?text=Item+2" alt="Product" style="width: 100%; border-radius: 8px;" />
      <p style="text-align: center; margin: 8px 0 2px 0; font-size: 14px; font-weight: bold;">Item Name</p>
      <p style="text-align: center; margin: 0; font-size: 14px; color: #666;">€49.00</p>
    </td>
    <td width="31%" valign="top" style="padding-left: 2%;">
      <img src="https://placehold.co/180x220/c4b8a8/333333?text=Item+3" alt="Product" style="width: 100%; border-radius: 8px;" />
      <p style="text-align: center; margin: 8px 0 2px 0; font-size: 14px; font-weight: bold;">Item Name</p>
      <p style="text-align: center; margin: 0; font-size: 14px; color: #666;">€49.00</p>
    </td>
  </tr>
</table>`,

        saleBanner: `
<div style="background: #dc2626; color: white; padding: 24px; text-align: center; border-radius: 8px; margin: 16px 0;">
  <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Limited Time</p>
  <h2 style="margin: 0 0 8px 0; font-size: 36px; font-weight: bold;">SALE 50% OFF</h2>
  <p style="margin: 0 0 16px 0; font-size: 16px;">Op geselecteerde items • Deze week alleen!</p>
  <a href="#" style="display: inline-block; background: white; color: #dc2626; padding: 12px 32px; border-radius: 4px; text-decoration: none; font-weight: bold;">Shop de Sale →</a>
</div>`,

        featureImage: `
<div style="margin: 16px 0;">
  <img src="https://placehold.co/600x400/f5f0eb/333333?text=Featured+Image" alt="Featured" style="width: 100%; border-radius: 8px;" />
  <p style="text-align: center; margin: 16px 0 0 0; font-style: italic; color: #666;">Add your caption here</p>
</div>`,

        ctaButton: `
<div style="text-align: center; margin: 24px 0;">
  <a href="#" style="display: inline-block; background: #1a1a1a; color: white; padding: 16px 40px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 16px;">Shop Now →</a>
</div>`,

        divider: `
<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />`,

        spacer: `
<div style="height: 32px;"></div>`,

        // Colored content blocks
        sectionLight: `
<div style="background-color: #f8f9fa; padding: 24px; margin: 16px 0; border-radius: 8px;">
  <h2 style="margin: 0 0 12px 0; color: #1a1a1a;">Section Title</h2>
  <p style="margin: 0; color: #444444;">Add your content here. This block has a light gray background that helps separate content sections.</p>
</div>`,

        sectionDark: `
<div style="background-color: #1a1a1a; padding: 24px; margin: 16px 0; border-radius: 8px;">
  <h2 style="margin: 0 0 12px 0; color: #ffffff;">Section Title</h2>
  <p style="margin: 0; color: #cccccc;">Add your content here. This block has a dark background for high contrast sections.</p>
</div>`,

        sectionAccent: `
<div style="background-color: #c8a97e; padding: 24px; margin: 16px 0; border-radius: 8px;">
  <h2 style="margin: 0 0 12px 0; color: #1a1a1a;">Section Title</h2>
  <p style="margin: 0; color: #333333;">Add your content here. This block uses your brand accent color.</p>
</div>`,

        sectionBlue: `
<div style="background-color: #e3f2fd; padding: 24px; margin: 16px 0; border-radius: 8px;">
  <h2 style="margin: 0 0 12px 0; color: #1565c0;">Section Title</h2>
  <p style="margin: 0; color: #1976d2;">Add your content here. Blue themed section for highlights or tips.</p>
</div>`,

        sectionPink: `
<div style="background-color: #fce4ec; padding: 24px; margin: 16px 0; border-radius: 8px;">
  <h2 style="margin: 0 0 12px 0; color: #c2185b;">Section Title</h2>
  <p style="margin: 0; color: #d81b60;">Add your content here. Pink themed section for promotions.</p>
</div>`,
    };

    // Clean empty paragraphs from HTML
    const cleanHtml = (html: string): string => {
        let cleaned = html;
        // Run multiple passes to catch nested/consecutive empty tags
        for (let i = 0; i < 3; i++) {
            cleaned = cleaned
                // Remove completely empty paragraphs
                .replace(/<p><\/p>/gi, '')
                // Remove empty paragraphs with only whitespace
                .replace(/<p>\s*<\/p>/gi, '')
                // Remove empty paragraphs with style attribute
                .replace(/<p[^>]*>(\s|<br\s*\/?>|&nbsp;)*<\/p>/gi, '')
                // Remove trailing breaks
                .replace(
                    /<br\s*class="ProseMirror-trailingBreak"\s*\/?>/gi,
                    '',
                );
        }
        return cleaned.replace(/\n{3,}/g, '\n\n').trim();
    };

    const editor = useEditor({
        extensions,
        immediatelyRender: false,
        content: cleanHtml(content || ''),
        onUpdate: ({ editor }) => {
            const html = cleanHtml(editor.getHTML());
            onChange(html);
        },
        onSelectionUpdate: ({ editor }) => {
            const { from } = editor.state.selection;
            const node = editor.state.doc.nodeAt(from);

            // Only update selectedImage state if an image is selected
            // Don't close panels here - let click handlers manage that
            if (node?.type.name === 'image') {
                // Extract current image attributes
                const attrs = node.attrs;
                const style = attrs.style || '';

                // Parse inline styles
                const widthMatch = style.match(/width:\s*(\d+(?:px|%)?)/);
                const heightMatch = style.match(/height:\s*(\d+(?:px|%)?)/);
                const borderRadiusMatch = style.match(
                    /border-radius:\s*(\d+px)/,
                );
                const alignMatch = style.match(
                    /(?:margin-left:\s*auto|margin-right:\s*auto|display:\s*block)/g,
                );

                let align: 'left' | 'center' | 'right' = 'left';
                if (alignMatch) {
                    if (
                        style.includes('margin-left: auto') &&
                        style.includes('margin-right: auto')
                    ) {
                        align = 'center';
                    } else if (style.includes('margin-left: auto')) {
                        align = 'right';
                    }
                }

                // Check if image is wrapped in a link by looking at the DOM
                let linkUrl = '';
                try {
                    const domNode = editor.view.nodeDOM(from);
                    if (domNode instanceof HTMLElement) {
                        const parentAnchor = domNode.closest('a');
                        if (parentAnchor) {
                            linkUrl = parentAnchor.getAttribute('href') || '';
                        }
                    }
                } catch {
                    // Ignore errors when checking for parent link
                }

                setSelectedImage({
                    src: attrs.src || '',
                    alt: attrs.alt || '',
                    width: widthMatch ? widthMatch[1] : '',
                    height: heightMatch ? heightMatch[1] : '',
                    align,
                    link: linkUrl,
                    borderRadius: borderRadiusMatch
                        ? borderRadiusMatch[1]
                        : '0px',
                });
                setSelectedImagePos(from); // Store position for Apply button
                setShowImageEditor(true);
                setShowBlockEditor(false);
            }
            // Don't close panels in else branch - let wrapper click handler manage that
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 [&_a]:pointer-events-none [&_a]:cursor-default [&_img]:cursor-pointer [&_img]:hover:outline [&_img]:hover:outline-2 [&_img]:hover:outline-blue-400 [&_img]:hover:outline-offset-2 [&_img]:transition-all',
            },
            handleClick: (_view, _pos, event) => {
                // Prevent links from being followed in the editor
                const target = event.target as HTMLElement;
                if (target.tagName === 'A' || target.closest('a')) {
                    event.preventDefault();
                    return true;
                }
                return false;
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

    // Add link to image - wraps selected image in <a> tag
    const setImageLink = useCallback(() => {
        if (!editor) return;

        const { from } = editor.state.selection;

        // Check if we have an image selected by looking at the node
        const node = editor.state.doc.nodeAt(from);
        if (!node || node.type.name !== 'image') {
            alert('Please select an image first');
            return;
        }

        const imgSrc = node.attrs.src;
        const imgAlt = node.attrs.alt || '';

        const url = window.prompt('Enter link URL for this image:');
        if (!url) return;

        // Create linked image HTML
        const linkedImageHtml = `<a href="${url}" target="_blank" style="display: inline-block;"><img src="${imgSrc}" alt="${imgAlt}" /></a>`;

        // Delete the current image and insert the linked version
        editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(linkedImageHtml)
            .run();
    }, [editor]);

    // Update image with new styles
    const updateImage = useCallback(() => {
        if (!editor || !selectedImage || selectedImagePos === null) return;

        const node = editor.state.doc.nodeAt(selectedImagePos);
        if (!node || node.type.name !== 'image') return;

        // Build inline style string for email compatibility
        const styles: string[] = [];

        if (selectedImage.width) {
            styles.push(
                `width: ${selectedImage.width.includes('%') || selectedImage.width.includes('px') ? selectedImage.width : selectedImage.width + 'px'}`,
            );
        }
        if (selectedImage.height) {
            styles.push(
                `height: ${selectedImage.height.includes('%') || selectedImage.height.includes('px') ? selectedImage.height : selectedImage.height + 'px'}`,
            );
        }
        if (
            selectedImage.borderRadius &&
            selectedImage.borderRadius !== '0px'
        ) {
            styles.push(`border-radius: ${selectedImage.borderRadius}`);
        }

        // Alignment styles
        if (selectedImage.align === 'center') {
            styles.push(
                'display: block',
                'margin-left: auto',
                'margin-right: auto',
            );
        } else if (selectedImage.align === 'right') {
            styles.push('display: block', 'margin-left: auto');
        }

        const styleString = styles.join('; ');

        // Build the image HTML
        let imgHtml = `<img src="${selectedImage.src}" alt="${selectedImage.alt}" ${styleString ? `style="${styleString}"` : ''} />`;

        // Wrap with link if provided
        if (selectedImage.link) {
            imgHtml = `<a href="${selectedImage.link}" target="_blank" style="display: inline-block;">${imgHtml}</a>`;
        }

        // Check if image is wrapped in anchor and get the full selection range
        let deleteFrom = selectedImagePos;
        let deleteTo = selectedImagePos + 1;

        try {
            const domNode = editor.view.nodeDOM(selectedImagePos);
            if (domNode instanceof HTMLElement) {
                const parentAnchor = domNode.closest('a');
                if (parentAnchor) {
                    // Find the position of the anchor wrapper to delete it too
                    const anchorPos = editor.view.posAtDOM(parentAnchor, 0);
                    if (anchorPos >= 0) {
                        deleteFrom = anchorPos;
                        deleteTo = anchorPos + parentAnchor.outerHTML.length;
                    }
                }
            }
        } catch {
            // Fall back to just the image position
        }

        // Delete the old content and insert new
        editor
            .chain()
            .focus()
            .setTextSelection({ from: deleteFrom, to: deleteTo })
            .deleteSelection()
            .insertContent(imgHtml)
            .run();

        setShowImageEditor(false);
        setSelectedImagePos(null);
    }, [editor, selectedImage, selectedImagePos]);

    // Delete selected image
    const deleteImage = useCallback(() => {
        if (!editor || selectedImagePos === null) return;
        editor
            .chain()
            .focus()
            .setNodeSelection(selectedImagePos)
            .deleteSelection()
            .run();
        setShowImageEditor(false);
        setSelectedImage(null);
        setSelectedImagePos(null);
    }, [editor, selectedImagePos]);

    // Wrap selected content in a styled section
    const wrapInSection = useCallback(
        (bgColor: string = '#f8f9fa', textColor: string = '#1a1a1a') => {
            if (!editor) return;

            const { from, to } = editor.state.selection;
            const selectedContent = editor.state.doc.textBetween(from, to, ' ');

            if (!selectedContent.trim()) {
                // No selection - insert empty section block
                const sectionHtml = `<div style="background-color: ${bgColor}; padding: 24px; margin: 16px 0; border-radius: 8px;"><h2 style="margin: 0 0 12px 0; color: ${textColor};">Section Title</h2><p style="margin: 0; color: ${textColor};">Add your content here.</p></div><p></p>`;
                editor.chain().focus().insertContent(sectionHtml).run();
                return;
            }

            // Wrap selection in a section div
            editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent(
                    `<div style="background-color: ${bgColor}; padding: 24px; margin: 16px 0; border-radius: 8px;"><p style="margin: 0; color: ${textColor};">${selectedContent}</p></div><p></p>`,
                )
                .run();
        },
        [editor],
    );

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
                    const errorText = await response
                        .text()
                        .catch(() => 'No error text');
                    throw new Error(
                        `Upload failed with status ${response.status}: ${errorText}`,
                    );
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

    const insertBlock = useCallback(
        (html: string) => {
            if (!editor) return;
            editor.chain().focus().insertContent(html).run();
        },
        [editor],
    );

    // Expose insertBlock to parent component
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady({ insertBlock });
        }
    }, [editor, onEditorReady, insertBlock]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className='border rounded-md bg-white shadow-sm flex flex-col resize-y overflow-hidden'
            style={{
                minHeight: minimal ? 150 : minHeight,
                height: minimal ? 200 : 400,
            }}
        >
            <div className='flex gap-1 p-2 border-b bg-gray-50 flex-wrap items-center shrink-0'>
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

                {/* Font Family */}
                <div className='flex gap-1 border-r pr-2 mr-2 items-center'>
                    <select
                        onChange={(e) => {
                            const fontFamily = e.target.value;
                            const sel = savedSelectionRef.current;
                            if (fontFamily) {
                                if (sel && sel.from !== sel.to) {
                                    editor
                                        .chain()
                                        .focus()
                                        .setTextSelection(sel)
                                        .setMark('textStyle', { fontFamily })
                                        .run();
                                } else {
                                    editor
                                        .chain()
                                        .focus()
                                        .setMark('textStyle', { fontFamily })
                                        .run();
                                }
                            } else {
                                editor
                                    .chain()
                                    .focus()
                                    .unsetMark('textStyle')
                                    .run();
                            }
                        }}
                        onMouseDown={() => {
                            if (editor) {
                                const { from, to } = editor.state.selection;
                                savedSelectionRef.current = { from, to };
                            }
                        }}
                        value={
                            editor.getAttributes('textStyle').fontFamily || ''
                        }
                        className='text-xs border rounded px-2 py-1 h-8 min-w-[100px]'
                        title='Font Family'
                    >
                        <option value=''>Default</option>
                        <option value='Arial, sans-serif'>Arial</option>
                        <option value='Helvetica, sans-serif'>Helvetica</option>
                        <option value='Georgia, serif'>Georgia</option>
                        <option value='"Times New Roman", serif'>
                            Times New Roman
                        </option>
                        <option value='Verdana, sans-serif'>Verdana</option>
                        <option value='Tahoma, sans-serif'>Tahoma</option>
                        <option value='Trebuchet MS, sans-serif'>
                            Trebuchet MS
                        </option>
                        <option value='Courier New, monospace'>
                            Courier New
                        </option>
                    </select>
                </div>

                {/* Colors */}
                <div className='flex gap-1 border-r pr-2 mr-2 items-center'>
                    <Popover
                        onOpenChange={(open) => {
                            if (open && editor) {
                                const { from, to } = editor.state.selection;
                                savedSelectionRef.current = { from, to };
                            }
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                                title='Text Color'
                                onMouseDown={() => {
                                    if (editor) {
                                        const { from, to } =
                                            editor.state.selection;
                                        savedSelectionRef.current = {
                                            from,
                                            to,
                                        };
                                    }
                                }}
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
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                const sel =
                                                    savedSelectionRef.current;
                                                if (
                                                    sel &&
                                                    sel.from !== sel.to
                                                ) {
                                                    editor
                                                        .chain()
                                                        .focus()
                                                        .setTextSelection(sel)
                                                        .setColor(color)
                                                        .run();
                                                } else {
                                                    editor
                                                        .chain()
                                                        .focus()
                                                        .setColor(color)
                                                        .run();
                                                }
                                            }}
                                            className={`w-6 h-6 rounded-full border ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-offset-1 ring-black' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type='color'
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            const sel =
                                                savedSelectionRef.current;
                                            if (sel && sel.from !== sel.to) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .setTextSelection(sel)
                                                    .setColor(e.target.value)
                                                    .run();
                                            } else {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .setColor(e.target.value)
                                                    .run();
                                            }
                                        }}
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                                disabled={uploading}
                                className={uploading ? 'animate-pulse' : ''}
                            >
                                <ImageIcon className='h-4 w-4' />
                                <ChevronDown className='h-3 w-3 ml-1' />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                            <DropdownMenuLabel>Insert Image</DropdownMenuLabel>
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                asChild
                            >
                                <label className='cursor-pointer flex items-center'>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={(e) => {
                                            handleImageUpload(e);
                                        }}
                                        className='hidden'
                                        disabled={uploading}
                                    />
                                    <ImageIcon className='mr-2 h-4 w-4' />
                                    Upload New
                                </label>
                            </DropdownMenuItem>
                            <MediaLibrary
                                onSelect={(url) => {
                                    editor
                                        ?.chain()
                                        .focus()
                                        .setImage({ src: url })
                                        .run();
                                }}
                                trigger={
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        <ImagePlus className='mr-2 h-4 w-4' />
                                        Media Library
                                    </DropdownMenuItem>
                                }
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={setImageLink}
                        title='Add Link to Image (select image first)'
                    >
                        <ImagePlus className='h-4 w-4' />
                    </Button>
                </div>

                {/* Wrap in Section */}
                {!minimal && (
                    <div className='flex gap-1 border-l pl-2 ml-2'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='gap-1'
                                    title='Wrap content in styled section'
                                >
                                    <Square className='h-4 w-4' />
                                    Section
                                    <ChevronDown className='h-3 w-3' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='start' className='w-48'>
                                <DropdownMenuLabel>
                                    Wrap in Section
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#f8f9fa', '#1a1a1a')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-gray-100 border' />
                                    Light Gray
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#1a1a1a', '#ffffff')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-gray-800 border' />
                                    Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#fef3c7', '#92400e')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-amber-100 border' />
                                    Warm / Accent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#dbeafe', '#1e40af')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-blue-100 border' />
                                    Blue
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#fce7f3', '#9d174d')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-pink-100 border' />
                                    Pink
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        wrapInSection('#d1fae5', '#065f46')
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-green-100 border' />
                                    Green
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Blocks Dropdown */}
                {!minimal && (
                    <div className='flex gap-1'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='gap-1'
                                >
                                    <LayoutGrid className='h-4 w-4' />
                                    Blocks
                                    <ChevronDown className='h-3 w-3' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='start' className='w-56'>
                                <DropdownMenuLabel>
                                    Fashion Blocks
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => insertBlock(blocks.hero)}
                                >
                                    <Sparkles className='mr-2 h-4 w-4 text-purple-500' />
                                    Hero Banner
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.saleBanner)
                                    }
                                >
                                    <Megaphone className='mr-2 h-4 w-4 text-red-500' />
                                    Sale Banner
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>
                                    Product Layouts
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.twoColumn)
                                    }
                                >
                                    <ShoppingBag className='mr-2 h-4 w-4' />
                                    2-Column Products
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.threeColumn)
                                    }
                                >
                                    <ShoppingBag className='mr-2 h-4 w-4' />
                                    3-Column Products
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Elements</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.featureImage)
                                    }
                                >
                                    <ImagePlus className='mr-2 h-4 w-4' />
                                    Featured Image
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.ctaButton)
                                    }
                                >
                                    <LayoutGrid className='mr-2 h-4 w-4' />
                                    CTA Button
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertBlock(blocks.divider)}
                                >
                                    <LayoutGrid className='mr-2 h-4 w-4' />
                                    Divider
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertBlock(blocks.spacer)}
                                >
                                    <LayoutGrid className='mr-2 h-4 w-4' />
                                    Spacer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>
                                    Content Sections
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.sectionLight)
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-gray-200 border' />
                                    Light Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.sectionDark)
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-gray-800 border' />
                                    Dark Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.sectionAccent)
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-[#c8a97e] border' />
                                    Accent Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.sectionBlue)
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-blue-200 border' />
                                    Blue Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        insertBlock(blocks.sectionPink)
                                    }
                                >
                                    <div className='mr-2 h-4 w-4 rounded bg-pink-200 border' />
                                    Pink Section
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Source Toggle */}
                <div className='ml-auto pl-2 border-l flex gap-1'>
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
            {isSourceMode ? (
                <textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    className='flex-1 w-full p-4 font-mono text-sm border-0 focus:outline-none resize-none overflow-auto'
                />
            ) : (
                <div
                    className='flex-1 overflow-auto relative'
                    onClick={(e) => {
                        const target = e.target as HTMLElement;
                        // Detect clicks on section blocks (divs with background-color)
                        const blockDiv = target.closest(
                            'div[style*="background-color"]',
                        ) as HTMLElement;
                        if (blockDiv) {
                            // If already editing this same block, don't reset state
                            if (
                                selectedBlock?.element === blockDiv &&
                                showBlockEditor
                            ) {
                                return;
                            }

                            const style = blockDiv.getAttribute('style') || '';
                            const bgMatch = style.match(
                                /background-color:\s*([^;]+)/,
                            );
                            const paddingMatch =
                                style.match(/padding:\s*([^;]+)/);
                            const marginMatch =
                                style.match(/margin:\s*([^;]+)/);
                            const radiusMatch = style.match(
                                /border-radius:\s*([^;]+)/,
                            );
                            const borderWidthMatch = style.match(
                                /border-width:\s*([^;]+)/,
                            );
                            const borderStyleMatch = style.match(
                                /border-style:\s*([^;]+)/,
                            );
                            const borderColorMatch = style.match(
                                /border-color:\s*([^;]+)/,
                            );

                            // Find text color from any text element in the block
                            let textColor = '#1a1a1a';
                            const textElements = blockDiv.querySelectorAll(
                                'h1, h2, h3, h4, h5, h6, p, span, a',
                            );
                            for (const el of textElements) {
                                const elStyle = el.getAttribute('style') || '';
                                const colorMatch =
                                    elStyle.match(/color:\s*([^;]+)/);
                                if (colorMatch) {
                                    textColor = colorToHex(
                                        colorMatch[1].trim(),
                                    );
                                    break;
                                }
                            }

                            setSelectedBlock({
                                backgroundColor: bgMatch
                                    ? colorToHex(bgMatch[1].trim())
                                    : '#f8f9fa',
                                padding: paddingMatch
                                    ? paddingMatch[1].trim()
                                    : '24px',
                                margin: marginMatch
                                    ? marginMatch[1].trim()
                                    : '16px 0',
                                borderRadius: radiusMatch
                                    ? radiusMatch[1].trim()
                                    : '8px',
                                borderWidth: borderWidthMatch
                                    ? borderWidthMatch[1].trim()
                                    : '0px',
                                borderStyle: borderStyleMatch
                                    ? borderStyleMatch[1].trim()
                                    : 'solid',
                                borderColor: borderColorMatch
                                    ? colorToHex(borderColorMatch[1].trim())
                                    : '#000000',
                                textColor,
                                element: blockDiv,
                            });
                            setShowBlockEditor(true);
                            setShowImageEditor(false);
                        } else {
                            setShowBlockEditor(false);
                        }
                    }}
                >
                    <EditorContent editor={editor} />

                    {/* Image Editor Panel */}
                    {showImageEditor && selectedImage && (
                        <div
                            className='absolute bg-white border rounded-lg shadow-lg p-4 w-72 z-20'
                            style={{
                                top: `${8 + imagePanelPos.y}px`,
                                right: `${8 - imagePanelPos.x}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className='flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing'
                                onMouseDown={(e) => {
                                    if (
                                        (e.target as HTMLElement).closest(
                                            'button',
                                        )
                                    )
                                        return;
                                    e.preventDefault();
                                    dragRef.current = {
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        panelX: imagePanelPos.x,
                                        panelY: imagePanelPos.y,
                                    };
                                    const onMouseMove = (
                                        moveEvent: MouseEvent,
                                    ) => {
                                        if (!dragRef.current) return;
                                        const dx =
                                            moveEvent.clientX -
                                            dragRef.current.startX;
                                        const dy =
                                            moveEvent.clientY -
                                            dragRef.current.startY;
                                        setImagePanelPos({
                                            x: dragRef.current.panelX + dx,
                                            y: dragRef.current.panelY + dy,
                                        });
                                    };
                                    const onMouseUp = () => {
                                        dragRef.current = null;
                                        document.removeEventListener(
                                            'mousemove',
                                            onMouseMove,
                                        );
                                        document.removeEventListener(
                                            'mouseup',
                                            onMouseUp,
                                        );
                                    };
                                    document.addEventListener(
                                        'mousemove',
                                        onMouseMove,
                                    );
                                    document.addEventListener(
                                        'mouseup',
                                        onMouseUp,
                                    );
                                }}
                            >
                                <h4 className='font-semibold text-sm select-none'>
                                    ⋮⋮ Edit Image
                                </h4>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setShowImageEditor(false)}
                                    className='h-6 w-6 p-0'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>

                            {/* Size Controls */}
                            <div className='grid grid-cols-2 gap-2 mb-3'>
                                <div>
                                    <Label className='text-xs'>Width</Label>
                                    <input
                                        type='text'
                                        value={selectedImage.width}
                                        onChange={(e) =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                width: e.target.value,
                                            })
                                        }
                                        placeholder='e.g. 300px or 100%'
                                        className='w-full px-2 py-1 text-sm border rounded'
                                    />
                                </div>
                                <div>
                                    <Label className='text-xs'>Height</Label>
                                    <input
                                        type='text'
                                        value={selectedImage.height}
                                        onChange={(e) =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                height: e.target.value,
                                            })
                                        }
                                        placeholder='auto'
                                        className='w-full px-2 py-1 text-sm border rounded'
                                    />
                                </div>
                            </div>

                            {/* Alignment */}
                            <div className='mb-3'>
                                <Label className='text-xs'>Alignment</Label>
                                <div className='flex gap-1 mt-1'>
                                    <Button
                                        variant={
                                            selectedImage.align === 'left'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                align: 'left',
                                            })
                                        }
                                        className='flex-1'
                                    >
                                        <AlignLeft className='h-4 w-4' />
                                    </Button>
                                    <Button
                                        variant={
                                            selectedImage.align === 'center'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                align: 'center',
                                            })
                                        }
                                        className='flex-1'
                                    >
                                        <AlignCenter className='h-4 w-4' />
                                    </Button>
                                    <Button
                                        variant={
                                            selectedImage.align === 'right'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                align: 'right',
                                            })
                                        }
                                        className='flex-1'
                                    >
                                        <AlignRight className='h-4 w-4' />
                                    </Button>
                                </div>
                            </div>

                            {/* Border Radius */}
                            <div className='mb-3'>
                                <Label className='text-xs'>Border Radius</Label>
                                <input
                                    type='text'
                                    value={selectedImage.borderRadius}
                                    onChange={(e) =>
                                        setSelectedImage({
                                            ...selectedImage,
                                            borderRadius: e.target.value,
                                        })
                                    }
                                    placeholder='0px'
                                    className='w-full px-2 py-1 text-sm border rounded'
                                />
                            </div>

                            {/* Alt Text */}
                            <div className='mb-3'>
                                <Label className='text-xs'>Alt Text</Label>
                                <input
                                    type='text'
                                    value={selectedImage.alt}
                                    onChange={(e) =>
                                        setSelectedImage({
                                            ...selectedImage,
                                            alt: e.target.value,
                                        })
                                    }
                                    placeholder='Image description'
                                    className='w-full px-2 py-1 text-sm border rounded'
                                />
                            </div>

                            {/* Link */}
                            <div className='mb-4'>
                                <Label className='text-xs'>Link URL</Label>
                                <input
                                    type='text'
                                    value={selectedImage.link}
                                    onChange={(e) =>
                                        setSelectedImage({
                                            ...selectedImage,
                                            link: e.target.value,
                                        })
                                    }
                                    placeholder='https://...'
                                    className='w-full px-2 py-1 text-sm border rounded'
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className='flex gap-2'>
                                <Button
                                    variant='default'
                                    size='sm'
                                    onClick={updateImage}
                                    className='flex-1'
                                >
                                    Apply
                                </Button>
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={deleteImage}
                                >
                                    <Trash2 className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Block Editor Panel - Enhanced with all styling options */}
                    {showBlockEditor && selectedBlock && (
                        <div
                            className='absolute bg-white border rounded-lg shadow-lg p-3 z-20 w-72'
                            style={{
                                top: `${8 + blockPanelPos.y}px`,
                                left: `${8 + blockPanelPos.x}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {/* Header with drag handle */}
                            <div
                                className='flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing'
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (
                                        (e.target as HTMLElement).closest(
                                            'button',
                                        )
                                    )
                                        return;
                                    e.preventDefault();
                                    dragRef.current = {
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        panelX: blockPanelPos.x,
                                        panelY: blockPanelPos.y,
                                    };
                                    const onMouseMove = (
                                        moveEvent: MouseEvent,
                                    ) => {
                                        if (!dragRef.current) return;
                                        setBlockPanelPos({
                                            x:
                                                dragRef.current.panelX +
                                                (moveEvent.clientX -
                                                    dragRef.current.startX),
                                            y:
                                                dragRef.current.panelY +
                                                (moveEvent.clientY -
                                                    dragRef.current.startY),
                                        });
                                    };
                                    const onMouseUp = () => {
                                        dragRef.current = null;
                                        document.removeEventListener(
                                            'mousemove',
                                            onMouseMove,
                                        );
                                        document.removeEventListener(
                                            'mouseup',
                                            onMouseUp,
                                        );
                                    };
                                    document.addEventListener(
                                        'mousemove',
                                        onMouseMove,
                                    );
                                    document.addEventListener(
                                        'mouseup',
                                        onMouseUp,
                                    );
                                }}
                            >
                                <h4 className='font-semibold text-sm select-none'>
                                    ⋮⋮ Block Styles
                                </h4>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setShowBlockEditor(false)}
                                    className='h-6 w-6 p-0'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>

                            {/* Colors Row */}
                            <div className='grid grid-cols-2 gap-2 mb-3'>
                                <div>
                                    <Label className='text-xs'>
                                        Background
                                    </Label>
                                    <input
                                        type='color'
                                        value={selectedBlock.backgroundColor}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                backgroundColor: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'background-color',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full h-8 p-0 border rounded cursor-pointer'
                                    />
                                </div>
                                <div>
                                    <Label className='text-xs'>
                                        Text Color
                                    </Label>
                                    <input
                                        type='color'
                                        value={selectedBlock.textColor}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                textColor: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element
                                                    .querySelectorAll(
                                                        'h1, h2, h3, h4, h5, h6, p, span, a, li',
                                                    )
                                                    .forEach((el) => {
                                                        el.setAttribute(
                                                            'style',
                                                            updateStyleProperty(
                                                                el.getAttribute(
                                                                    'style',
                                                                ) || '',
                                                                'color',
                                                                e.target.value,
                                                            ),
                                                        );
                                                    });
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full h-8 p-0 border rounded cursor-pointer'
                                    />
                                </div>
                            </div>

                            {/* Spacing Row */}
                            <div className='grid grid-cols-2 gap-2 mb-3'>
                                <div>
                                    <Label className='text-xs'>Padding</Label>
                                    <select
                                        value={selectedBlock.padding}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                padding: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'padding',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full text-xs border rounded px-2 py-1.5'
                                    >
                                        <option value='0px'>0px</option>
                                        <option value='8px'>8px</option>
                                        <option value='12px'>12px</option>
                                        <option value='16px'>16px</option>
                                        <option value='24px'>24px</option>
                                        <option value='32px'>32px</option>
                                        <option value='40px'>40px</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className='text-xs'>Margin</Label>
                                    <select
                                        value={selectedBlock.margin}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                margin: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'margin',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full text-xs border rounded px-2 py-1.5'
                                    >
                                        <option value='0'>0</option>
                                        <option value='8px 0'>8px</option>
                                        <option value='16px 0'>16px</option>
                                        <option value='24px 0'>24px</option>
                                        <option value='32px 0'>32px</option>
                                    </select>
                                </div>
                            </div>

                            {/* Border Section */}
                            <div className='border-t pt-2 mb-2'>
                                <Label className='text-xs font-medium'>
                                    Border
                                </Label>
                            </div>
                            <div className='grid grid-cols-3 gap-2 mb-2'>
                                <div>
                                    <Label className='text-xs'>Width</Label>
                                    <select
                                        value={selectedBlock.borderWidth}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                borderWidth: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'border-width',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full text-xs border rounded px-1 py-1'
                                    >
                                        <option value='0px'>0</option>
                                        <option value='1px'>1px</option>
                                        <option value='2px'>2px</option>
                                        <option value='3px'>3px</option>
                                        <option value='4px'>4px</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className='text-xs'>Style</Label>
                                    <select
                                        value={selectedBlock.borderStyle}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                borderStyle: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'border-style',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full text-xs border rounded px-1 py-1'
                                    >
                                        <option value='solid'>Solid</option>
                                        <option value='dashed'>Dashed</option>
                                        <option value='dotted'>Dotted</option>
                                        <option value='double'>Double</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className='text-xs'>Radius</Label>
                                    <select
                                        value={selectedBlock.borderRadius}
                                        onChange={(e) => {
                                            const newBlock = {
                                                ...selectedBlock,
                                                borderRadius: e.target.value,
                                            };
                                            setSelectedBlock(newBlock);
                                            if (newBlock.element) {
                                                newBlock.element.setAttribute(
                                                    'style',
                                                    updateStyleProperty(
                                                        newBlock.element.getAttribute(
                                                            'style',
                                                        ) || '',
                                                        'border-radius',
                                                        e.target.value,
                                                    ),
                                                );
                                                // Styles applied to DOM - will be saved when user saves campaign
                                            }
                                        }}
                                        className='w-full text-xs border rounded px-1 py-1'
                                    >
                                        <option value='0'>0</option>
                                        <option value='4px'>4px</option>
                                        <option value='8px'>8px</option>
                                        <option value='12px'>12px</option>
                                        <option value='16px'>16px</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label className='text-xs'>Border Color</Label>
                                <input
                                    type='color'
                                    value={selectedBlock.borderColor}
                                    onChange={(e) => {
                                        const newBlock = {
                                            ...selectedBlock,
                                            borderColor: e.target.value,
                                        };
                                        setSelectedBlock(newBlock);
                                        if (newBlock.element) {
                                            newBlock.element.setAttribute(
                                                'style',
                                                updateStyleProperty(
                                                    newBlock.element.getAttribute(
                                                        'style',
                                                    ) || '',
                                                    'border-color',
                                                    e.target.value,
                                                ),
                                            );
                                        }
                                    }}
                                    className='w-full h-8 p-0 border rounded cursor-pointer'
                                />
                            </div>
                            {/* Apply Button */}
                            <div className='mt-3 pt-3 border-t'>
                                <Button
                                    size='sm'
                                    className='w-full'
                                    onClick={() => {
                                        const rawHtml =
                                            document.querySelector(
                                                '.ProseMirror',
                                            )?.innerHTML || '';
                                        onChange(cleanHtml(rawHtml));
                                        setShowBlockEditor(false);
                                    }}
                                >
                                    Apply Styles
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
