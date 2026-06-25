'use client';

import { useState } from 'react';
import {
    MoreHorizontal,
    Edit,
    Copy,
    Trash,
    Eye,
    Pencil,
    Send,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SendCampaignDialog } from '@/components/send-campaign-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SerializedCampaign } from './types';

export function ActionsCell({ campaign }: { campaign: SerializedCampaign }) {
    const router = useRouter();
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [newName, setNewName] = useState(campaign.name);

    const handleReplicate = async () => {
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/replicate`, {
                method: 'POST',
            });
            if (res.ok) router.refresh();
        } catch (e) {
            alert('Failed to replicate');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'DELETE',
            });
            router.refresh();
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const handleRename = async () => {
        try {
            await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: newName }),
                headers: { 'Content-Type': 'application/json' },
            });
            setIsRenameOpen(false);
            router.refresh();
        } catch (e) {
            alert('Failed to rename');
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/campaigns/${campaign.id}`}>
                            <Edit className='mr-2 h-4 w-4' /> Edit Content
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/campaigns/${campaign.id}/view`}
                            target='_blank'
                        >
                            <Eye className='mr-2 h-4 w-4' /> View Email
                        </Link>
                    </DropdownMenuItem>
                    {campaign.status === 'SENT' && (
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/admin/campaigns/${campaign.id}/analytics`}
                            >
                                <BarChart3 className='mr-2 h-4 w-4' /> Analytics
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {campaign.status !== 'SENT' && (
                        <DropdownMenuItem onClick={() => setIsSendOpen(true)}>
                            <Send className='mr-2 h-4 w-4' /> Send Campaign
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                        <Pencil className='mr-2 h-4 w-4' /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReplicate}>
                        <Copy className='mr-2 h-4 w-4' /> Replicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className='text-red-600 focus:text-red-600'
                    >
                        <Trash className='mr-2 h-4 w-4' /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Campaign</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4 py-2'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Campaign Name</Label>
                            <Input
                                id='name'
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setIsRenameOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRename}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SendCampaignDialog
                campaignId={campaign.id}
                campaignName={campaign.name}
                open={isSendOpen}
                onOpenChange={setIsSendOpen}
                onComplete={() => router.refresh()}
            />
        </>
    );
}
