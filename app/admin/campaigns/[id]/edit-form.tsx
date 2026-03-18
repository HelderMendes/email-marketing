'use client';

import { useState } from 'react';
import { Campaign } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/tiptap-editor';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { ThemeSettings } from './theme-settings';
import { defaultTheme, renderEmailHtml } from '@/lib/email-renderer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export function EditForm({ campaign }: { campaign: Campaign }) {
    const router = useRouter();
    const [name, setName] = useState(campaign.name);
    const [subject, setSubject] = useState(campaign.subject);
    const [content, setContent] = useState(campaign.htmlContent || '');
    const [theme, setTheme] = useState((campaign.theme as any) || defaultTheme);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name,
                    subject,
                    htmlContent: content,
                    theme,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('Saved successfully');
                router.refresh();
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (
            !confirm(
                'Are you sure you want to send this campaign to all SUBSCRIBED contacts?',
            )
        )
            return;

        setSending(true);
        // Implement send API call
        // POST /api/campaigns/[id]/send
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
                method: 'POST',
            });
            if (res.ok) {
                alert('Campaign queued for sending!');
                router.refresh();
            } else {
                alert('Failed to queue sending');
            }
        } catch (e) {
            alert('Error sending');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className='container mx-auto py-8 space-y-8 max-w-4xl'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <Button variant='ghost' size='icon' asChild>
                        <Link href='/admin/campaigns'>
                            <ArrowLeft className='h-4 w-4' />
                        </Link>
                    </Button>
                    <h1 className='text-2xl font-bold'>Edit Campaign</h1>
                </div>
                <div className='flex gap-2'>
                    <ThemeSettings theme={theme} onThemeChange={setTheme} />
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button variant='secondary'>
                                <Eye className='mr-2 h-4 w-4' />
                                Preview
                            </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-4xl h-[80vh] flex flex-col'>
                            <DialogHeader>
                                <DialogTitle>Preview Campaign</DialogTitle>
                                <DialogDescription>
                                    This is how your email will look.
                                </DialogDescription>
                            </DialogHeader>
                            <div className='flex-1 border rounded overflow-hidden'>
                                <iframe
                                    srcDoc={renderEmailHtml(content, theme)}
                                    className='w-full h-full'
                                    title='Preview'
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={() => setPreviewOpen(false)}
                                    variant='outline'
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button
                        variant='outline'
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending || campaign.status === 'SENT'}
                    >
                        <Send className='mr-2 h-4 w-4' />
                        {campaign.status === 'SENT'
                            ? 'Sent'
                            : 'Send Test / Send'}
                    </Button>
                </div>
            </div>

            <div className='grid gap-6 bg-white p-6 rounded-lg border shadow-sm'>
                <div className='grid gap-2'>
                    <Label htmlFor='name'>Internal Campaign Name</Label>
                    <Input
                        id='name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className='grid gap-2'>
                    <Label htmlFor='subject'>Email Subject Line</Label>
                    <Input
                        id='subject'
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className='grid gap-2'>
                    <Label>Email Content</Label>
                    <div className='min-h-[400px]'>
                        <TiptapEditor content={content} onChange={setContent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
