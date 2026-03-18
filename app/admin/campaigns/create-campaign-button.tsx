'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export function CreateCampaignButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !subject) return;

        setLoading(true);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                body: JSON.stringify({ name, subject }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                const campaign = await res.json();
                setOpen(false);
                router.refresh();
                // Redirect to edit page
                router.push(`/admin/campaigns/${campaign.id}`);
            } else {
                alert('Failed to create campaign');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className='mr-2 h-4 w-4' /> Create Campaign
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='name'>Campaign Name</Label>
                        <Input
                            id='name'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder='e.g. Summer Sale 2025'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='subject'>Email Subject</Label>
                        <Input
                            id='subject'
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder='e.g. Don not miss our Summer Sale!'
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
