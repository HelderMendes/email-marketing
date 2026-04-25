'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Campaign } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ImageStackEditor,
    imagesToHtml,
    htmlToImages,
    type ImageItem,
} from '@/components/image-stack-editor';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Send,
    Eye,
    Save,
    Smartphone,
    Monitor,
    Mail,
    Type,
    Palette,
    Settings,
    TestTube,
} from 'lucide-react';
import Link from 'next/link';
import {
    defaultTheme,
    renderEmailHtml,
    type EmailTheme,
} from '@/lib/email-renderer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SendCampaignDialog } from '@/components/send-campaign-dialog';

/* Mailchimp-inspired campaign editor with:
 * - Fixed header with campaign settings
 * - Left sidebar with content blocks
 * - Center canvas with live preview
 * - Right sidebar for design/theme settings
 */

type EditorView = 'desktop' | 'mobile';
type RightPanel = 'design' | 'settings';

type ContactGroup = {
    id: number;
    name: string;
    color: string | null;
    _count: { contacts: number };
};

export function EditForm({
    campaign,
    groups = [],
}: {
    campaign: Campaign;
    groups?: ContactGroup[];
}) {
    const router = useRouter();
    const [name, setName] = useState(campaign.name);
    const [subject, setSubject] = useState(campaign.subject || '');
    const [previewText, setPreviewText] = useState(campaign.previewText || '');
    // Parse existing content into images array
    const [images, setImages] = useState<ImageItem[]>(() =>
        htmlToImages(campaign.htmlContent || ''),
    );
    const [theme, setTheme] = useState<EmailTheme>(
        (campaign.theme as unknown as EmailTheme) || defaultTheme,
    );
    const [saving, setSaving] = useState(false);
    const [editorView, setEditorView] = useState<EditorView>('desktop');
    const [rightPanel, setRightPanel] = useState<RightPanel>('design');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [testEmailOpen, setTestEmailOpen] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testInstructions, setTestInstructions] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [sendDialogOpen, setSendDialogOpen] = useState(false);

    // Resizable panel state
    const [rightPanelWidth, setRightPanelWidth] = useState(288); // Default 288px (w-72)
    const isResizing = useRef(false);

    // Handle panel resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            // Constrain between 200px and 500px
            setRightPanelWidth(Math.min(500, Math.max(200, newWidth)));
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = useCallback(() => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name,
                    subject,
                    previewText,
                    htmlContent: imagesToHtml(images),
                    theme,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to save');
            }
        } catch {
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) return;
        setSendingTest(true);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    instructions: testInstructions,
                }),
            });
            if (res.ok) {
                alert(`Test email sent to ${testEmail}!`);
                setTestEmailOpen(false);
            } else {
                alert('Failed to send test email');
            }
        } catch {
            alert('Error sending test email');
        } finally {
            setSendingTest(false);
        }
    };

    const handleThemeChange = useCallback((key: string, value: string) => {
        setTheme((prev) => ({ ...prev, [key]: value }));
    }, []);

    return (
        <div className='h-screen flex flex-col bg-gray-100'>
            {/* Fixed Header */}
            <header className='bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 relative z-50'>
                <div className='flex items-center gap-4'>
                    <Button variant='ghost' size='icon' asChild>
                        <Link href='/admin/campaigns'>
                            <ArrowLeft className='h-4 w-4' />
                        </Link>
                    </Button>
                    <div className='flex flex-col'>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className='font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0 bg-transparent'
                            placeholder='Campaign name'
                        />
                        <span className='text-xs text-gray-500'>
                            {campaign.status === 'SENT' ? 'Sent' : 'Draft'}
                        </span>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    {/* View Toggle */}
                    <div className='flex border rounded-md overflow-hidden mr-2'>
                        <button
                            type='button'
                            onClick={() => setEditorView('desktop')}
                            className={cn(
                                'px-3 h-8 hover:bg-gray-50',
                                editorView === 'desktop' && 'bg-gray-100',
                            )}
                        >
                            <Monitor className='h-4 w-4' />
                        </button>
                        <button
                            type='button'
                            onClick={() => setEditorView('mobile')}
                            className={cn(
                                'px-3 h-8 hover:bg-gray-50',
                                editorView === 'mobile' && 'bg-gray-100',
                            )}
                        >
                            <Smartphone className='h-4 w-4' />
                        </button>
                    </div>

                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPreviewOpen(true)}
                    >
                        <Eye className='h-4 w-4 mr-1' />
                        Preview
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setTestEmailOpen(true)}
                    >
                        <TestTube className='h-4 w-4 mr-1' />
                        Test
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save className='h-4 w-4 mr-1' />
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        size='sm'
                        onClick={() => setSendDialogOpen(true)}
                        disabled={campaign.status === 'SENT'}
                    >
                        <Send className='h-4 w-4 mr-1' />
                        {campaign.status === 'SENT' ? 'Sent' : 'Send'}
                    </Button>
                </div>
            </header>

            {/* Email Settings Bar */}
            <div className='bg-white border-b px-6 py-3 flex items-center gap-6 shrink-0'>
                <div className='flex items-center gap-2 flex-1'>
                    <Mail className='h-4 w-4 text-gray-400' />
                    <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className='flex-1 border-0 p-0 h-auto focus-visible:ring-0 text-sm'
                        placeholder='Email subject line...'
                    />
                </div>
                <div className='w-px h-6 bg-gray-200' />
                <div className='flex items-center gap-2 flex-1'>
                    <Type className='h-4 w-4 text-gray-400' />
                    <Input
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        className='flex-1 border-0 p-0 h-auto focus-visible:ring-0 text-sm'
                        placeholder='Preview text (shows in inbox)...'
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className='flex-1 flex overflow-hidden'>
                {/* Left Sidebar - Image Stack Editor */}
                <aside className='w-80 bg-white border-r shrink-0 flex flex-col'>
                    <div className='p-4 border-b'>
                        <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                            Newsletter Images
                        </h3>
                        <p className='text-xs text-gray-400 mt-1'>
                            Add images that link to your website
                        </p>
                    </div>
                    <ScrollArea className='flex-1'>
                        <div className='p-4'>
                            <ImageStackEditor
                                images={images}
                                onChange={setImages}
                                defaultLink='https://lookoutmode.nl'
                            />
                        </div>
                    </ScrollArea>
                </aside>

                {/* Center Canvas - Full Email Preview */}
                <main
                    className='flex-1 overflow-auto p-6'
                    style={{
                        backgroundColor: theme.backgroundColor || '#f6f9fc',
                    }}
                >
                    <div
                        className={cn(
                            'mx-auto transition-all',
                            editorView === 'mobile'
                                ? 'w-[375px]'
                                : 'min-w-full',
                        )}
                        style={{
                            maxWidth:
                                editorView === 'mobile'
                                    ? 375
                                    : (theme.contentMaxWidth || 600) + 80,
                        }}
                    >
                        {/* Email Header Preview */}
                        <div
                            className='text-center py-5 rounded-t-lg'
                            style={{
                                backgroundColor: theme.headerBg || '#ffffff',
                            }}
                        >
                            <h1
                                className='text-xl font-bold m-0'
                                style={{ color: theme.headerText || '#111111' }}
                            >
                                {theme.headerContent || 'LOOKOUT MODE'}
                            </h1>
                        </div>

                        {/* Email Header */}
                        {theme.emailHeaderContent && (
                            <div
                                className='py-5 px-4 text-center text-sm'
                                style={{
                                    backgroundColor:
                                        theme.emailHeaderBg || '#eef2f5',
                                    color: theme.textColor || '#333333',
                                }}
                                suppressHydrationWarning
                                dangerouslySetInnerHTML={{
                                    __html: theme.emailHeaderContent,
                                }}
                            />
                        )}

                        {/* Main Content Area - Image Stack */}
                        <div suppressHydrationWarning>
                            <div
                                className='overflow-hidden'
                                style={{
                                    backgroundColor:
                                        theme.contentBg || '#ffffff',
                                    maxWidth: theme.contentMaxWidth || 600,
                                    margin: '0 auto',
                                }}
                                suppressHydrationWarning
                            >
                                {/* Preview of stacked images */}
                                {images.length === 0 ? (
                                    <div className='py-20 text-center text-gray-400'>
                                        <p>No images yet</p>
                                        <p className='text-sm'>
                                            Add images in the right panel
                                        </p>
                                    </div>
                                ) : (
                                    images
                                        .filter((img) => img.src)
                                        .map((img) => (
                                            <a
                                                key={img.id}
                                                href={img.link || '#'}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                style={{ display: 'block' }}
                                            >
                                                <img
                                                    src={img.src}
                                                    alt=''
                                                    style={{
                                                        width: '100%',
                                                        display: 'block',
                                                        border: 0,
                                                    }}
                                                />
                                            </a>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* Instagram Button Preview */}
                        <div
                            className='py-5 text-center'
                            style={{
                                backgroundColor: theme.preFooterBg || '#f0f0f0',
                            }}
                        >
                            <a
                                href='https://www.instagram.com/lookoutmode/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-block px-16 py-3 text-xl font-medium no-underline'
                                style={{
                                    backgroundColor:
                                        theme.instagramButtonBg || '#d4a5b9',
                                    color:
                                        theme.instagramButtonText || '#ffffff',
                                    borderRadius: `${theme.instagramButtonRadius ?? 50}px`,
                                    border: `2px solid ${theme.instagramButtonBorder || '#d4a5b9'}`,
                                }}
                            >
                                Volg lookoutmode op instagram
                            </a>
                        </div>

                        {/* Footer Preview */}
                        <div
                            className='py-10 px-5 text-center text-sm rounded-b-lg'
                            style={{
                                backgroundColor: theme.footerBg || '#2a2a2a',
                                color: theme.footerText || '#ffffff',
                            }}
                        >
                            <p className='m-0 mb-4'>
                                © {new Date().getFullYear()} Look Out Mode
                            </p>
                            <p className='m-0 mb-4 text-xs opacity-70'>
                                Huizerweg 45 – 1401 GH, Bussum
                            </p>
                            <p className='m-0 text-xs'>
                                <span className='underline cursor-pointer'>
                                    Update preferences
                                </span>
                                {' • '}
                                <span className='underline cursor-pointer'>
                                    Unsubscribe
                                </span>
                            </p>
                        </div>
                    </div>
                </main>

                {/* Resizable Divider */}
                <div
                    onMouseDown={startResizing}
                    className='w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 relative group'
                >
                    <div className='absolute inset-y-0 -left-1 -right-1' />
                    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity' />
                </div>

                {/* Right Sidebar - Design Settings */}
                <aside
                    className='bg-white border-l shrink-0 flex flex-col'
                    style={{ width: rightPanelWidth }}
                >
                    <Tabs
                        value={rightPanel}
                        onValueChange={(v) => setRightPanel(v as RightPanel)}
                        className='flex flex-col h-full'
                    >
                        <TabsList className='w-full rounded-none border-b h-auto p-0'>
                            <TabsTrigger
                                value='design'
                                className='flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500'
                            >
                                <Palette className='h-4 w-4 mr-2' />
                                Design
                            </TabsTrigger>
                            <TabsTrigger
                                value='settings'
                                className='flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500'
                            >
                                <Settings className='h-4 w-4 mr-2' />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value='design'
                            className='flex-1 m-0 overflow-auto'
                        >
                            <ScrollArea className='h-full'>
                                <div className='p-4 space-y-6'>
                                    {/* Colors Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Colors
                                        </h4>
                                        <ColorPicker
                                            label='Background'
                                            value={
                                                theme.backgroundColor ||
                                                '#f6f9fc'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'backgroundColor',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Text'
                                            value={theme.textColor || '#333333'}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'textColor',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Links'
                                            value={theme.linkColor || '#0070f3'}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'linkColor',
                                                    v,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Header Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Header
                                        </h4>
                                        <ColorPicker
                                            label='Header Background'
                                            value={theme.headerBg || '#ffffff'}
                                            onChange={(v) =>
                                                handleThemeChange('headerBg', v)
                                            }
                                        />
                                    </div>

                                    {/* Content Area Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Content Area
                                        </h4>
                                        <ColorPicker
                                            label='Content Background'
                                            value={
                                                theme.contentBg ||
                                                theme.backgroundColor ||
                                                '#f6f9fc'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'contentBg',
                                                    v,
                                                )
                                            }
                                        />
                                        <div className='flex items-center justify-between'>
                                            <Label className='text-sm'>
                                                Padding X (left/right)
                                            </Label>
                                            <div className='flex items-center gap-2'>
                                                <Input
                                                    type='number'
                                                    value={
                                                        theme.contentPaddingX ??
                                                        0
                                                    }
                                                    onChange={(e) =>
                                                        handleThemeChange(
                                                            'contentPaddingX',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className='w-20 h-8 text-sm'
                                                    min={0}
                                                    max={100}
                                                />
                                                <span className='text-xs text-gray-500'>
                                                    px
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <Label className='text-sm'>
                                                Padding Y (top/bottom)
                                            </Label>
                                            <div className='flex items-center gap-2'>
                                                <Input
                                                    type='number'
                                                    value={
                                                        theme.contentPaddingY ??
                                                        0
                                                    }
                                                    onChange={(e) =>
                                                        handleThemeChange(
                                                            'contentPaddingY',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className='w-20 h-8 text-sm'
                                                    min={0}
                                                    max={100}
                                                />
                                                <span className='text-xs text-gray-500'>
                                                    px
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <Label className='text-sm'>
                                                Max Width
                                            </Label>
                                            <div className='flex items-center gap-2'>
                                                <Input
                                                    type='number'
                                                    value={
                                                        theme.contentMaxWidth ||
                                                        600
                                                    }
                                                    onChange={(e) =>
                                                        handleThemeChange(
                                                            'contentMaxWidth',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className='w-20 h-8 text-sm'
                                                    min={400}
                                                    max={800}
                                                />
                                                <span className='text-xs text-gray-500'>
                                                    px
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Footer
                                        </h4>
                                        <ColorPicker
                                            label='Footer Background'
                                            value={theme.footerBg || '#2a2a2a'}
                                            onChange={(v) =>
                                                handleThemeChange('footerBg', v)
                                            }
                                        />
                                        <ColorPicker
                                            label='Footer Text'
                                            value={
                                                theme.footerText || '#ffffff'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'footerText',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Footer Link Color'
                                            value={
                                                theme.footerLinkColor ||
                                                '#c896aa'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'footerLinkColor',
                                                    v,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Social Icons Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Social Icons Style
                                        </h4>
                                        <ColorPicker
                                            label='Icon Background'
                                            value={
                                                theme.socialIconBg || '#333333'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'socialIconBg',
                                                    v,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent
                            value='settings'
                            className='flex-1 m-0 overflow-auto'
                        >
                            <ScrollArea className='h-full'>
                                <div className='p-4 space-y-6'>
                                    {/* Header Content */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Header
                                        </h4>
                                        <div>
                                            <Label className='text-sm'>
                                                Header Text
                                            </Label>
                                            <Input
                                                type='text'
                                                value={
                                                    theme.headerContent ||
                                                    'LOOKOUT MODE )@'
                                                }
                                                onChange={(e) =>
                                                    handleThemeChange(
                                                        'headerContent',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Your brand name'
                                                className='mt-1'
                                            />
                                        </div>
                                    </div>

                                    {/* Email Header Content */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Email Header
                                        </h4>
                                        <ColorPicker
                                            label='Background'
                                            value={
                                                theme.emailHeaderBg || '#eef2f5'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'emailHeaderBg',
                                                    v,
                                                )
                                            }
                                        />
                                        <div>
                                            <Label className='text-sm'>
                                                Header Text (optional)
                                            </Label>
                                            <textarea
                                                value={
                                                    theme.emailHeaderContent ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleThemeChange(
                                                        'emailHeaderContent',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='e.g. LOOKOUT MODE )@'
                                                className='w-full min-h-[60px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring'
                                            />
                                        </div>
                                    </div>

                                    {/* Instagram Button Section */}
                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Instagram Button
                                        </h4>
                                        <ColorPicker
                                            label='Section Background'
                                            value={
                                                theme.preFooterBg || '#f0f0f0'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'preFooterBg',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Button Background'
                                            value={
                                                theme.instagramButtonBg ||
                                                '#d4a5b9'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'instagramButtonBg',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Button Text'
                                            value={
                                                theme.instagramButtonText ||
                                                '#ffffff'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'instagramButtonText',
                                                    v,
                                                )
                                            }
                                        />
                                        <ColorPicker
                                            label='Button Border'
                                            value={
                                                theme.instagramButtonBorder ||
                                                '#d4a5b9'
                                            }
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'instagramButtonBorder',
                                                    v,
                                                )
                                            }
                                        />
                                        <div className='flex items-center gap-2'>
                                            <Label className='text-sm min-w-[100px]'>
                                                Rounded Corners
                                            </Label>
                                            <Input
                                                type='number'
                                                min={0}
                                                max={100}
                                                value={
                                                    theme.instagramButtonRadius ??
                                                    50
                                                }
                                                onChange={(e) =>
                                                    handleThemeChange(
                                                        'instagramButtonRadius',
                                                        e.target.value,
                                                    )
                                                }
                                                className='w-20'
                                            />
                                            <span className='text-sm text-gray-500'>
                                                px
                                            </span>
                                        </div>
                                    </div>

                                    <div className='space-y-3'>
                                        <h4 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                                            Social Links
                                        </h4>
                                        <SocialInput
                                            icon='facebook'
                                            value={theme.socialFacebook || ''}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'socialFacebook',
                                                    v,
                                                )
                                            }
                                            placeholder='https://facebook.com/...'
                                        />
                                        <SocialInput
                                            icon='instagram'
                                            value={theme.socialInstagram || ''}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'socialInstagram',
                                                    v,
                                                )
                                            }
                                            placeholder='https://instagram.com/...'
                                        />
                                        <SocialInput
                                            icon='twitter'
                                            value={theme.socialTwitter || ''}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'socialTwitter',
                                                    v,
                                                )
                                            }
                                            placeholder='https://x.com/...'
                                        />
                                        <SocialInput
                                            icon='linkedin'
                                            value={theme.socialLinkedin || ''}
                                            onChange={(v) =>
                                                handleThemeChange(
                                                    'socialLinkedin',
                                                    v,
                                                )
                                            }
                                            placeholder='https://linkedin.com/...'
                                        />
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </aside>
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className='max-w-4xl h-[85vh] flex flex-col'>
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                        <DialogDescription>
                            Subject: {subject || '(no subject)'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='flex-1 border rounded overflow-hidden bg-gray-100'>
                        <iframe
                            srcDoc={renderEmailHtml(
                                imagesToHtml(images),
                                theme,
                                {
                                    campaignId: campaign.id,
                                },
                            )}
                            className='w-full h-full bg-white'
                            title='Preview'
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Test Email Dialog */}
            <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                        <DialogDescription>
                            Send a preview to your email before sending to
                            subscribers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4 space-y-4'>
                        <div>
                            <Label className='text-sm font-medium mb-1.5 block'>
                                Email Address(es)
                            </Label>
                            <Input
                                type='email'
                                placeholder='your@email.com (use , or ; for multiple)'
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className='text-sm font-medium mb-1.5 block'>
                                Instructions (optional)
                            </Label>
                            <textarea
                                placeholder='e.g. Please check if colors look good, or did this go to spam?'
                                value={testInstructions}
                                onChange={(e) =>
                                    setTestInstructions(e.target.value)
                                }
                                className='w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring'
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setTestEmailOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendTest}
                            disabled={sendingTest || !testEmail}
                        >
                            {sendingTest ? 'Sending...' : 'Send Test'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Campaign Dialog */}
            <SendCampaignDialog
                campaignId={campaign.id}
                campaignName={campaign.name}
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
                onComplete={() => router.refresh()}
                groups={groups}
            />
        </div>
    );
}

// Helper component for color pickers
function ColorPicker({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className='flex items-center justify-between'>
            <Label className='text-sm'>{label}</Label>
            <div className='flex items-center gap-2'>
                <Input
                    type='color'
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className='w-8 h-8 p-0.5 cursor-pointer rounded'
                />
                <Input
                    type='text'
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className='w-20 h-8 text-xs font-mono'
                />
            </div>
        </div>
    );
}

// Helper component for social media inputs with icons
function SocialInput({
    icon,
    value,
    onChange,
    placeholder,
}: {
    icon: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const icons = {
        facebook: (
            <svg viewBox='0 0 24 24' className='w-4 h-4 fill-current'>
                <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
            </svg>
        ),
        instagram: (
            <svg viewBox='0 0 24 24' className='w-4 h-4 fill-current'>
                <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
            </svg>
        ),
        twitter: (
            <svg viewBox='0 0 24 24' className='w-4 h-4 fill-current'>
                <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
            </svg>
        ),
        linkedin: (
            <svg viewBox='0 0 24 24' className='w-4 h-4 fill-current'>
                <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
            </svg>
        ),
    };

    const colors = {
        facebook: 'bg-blue-600',
        instagram:
            'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
        twitter: 'bg-black',
        linkedin: 'bg-blue-700',
    };

    return (
        <div className='flex items-center gap-2'>
            <div
                className={`w-8 h-8 rounded-full ${colors[icon]} text-white flex items-center justify-center shrink-0`}
            >
                {icons[icon]}
            </div>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className='h-8 text-sm flex-1'
            />
        </div>
    );
}
