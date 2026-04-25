'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { SerializedContact, ContactGroup } from './types';

type GroupWithCount = {
    id: number;
    name: string;
    color: string | null;
    _count: { contacts: number };
};

interface EditContactDialogProps {
    contact: SerializedContact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableGroups?: GroupWithCount[];
}

export function EditContactDialog({
    contact,
    open,
    onOpenChange,
}: EditContactDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        tags: '',
        status: 'ACTIVE' as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED',
    });

    useEffect(() => {
        if (contact) {
            setForm({
                email: contact.email,
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                tags: contact.tags || '',
                status: contact.status as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED',
            });
        }
    }, [contact]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Failed to update contact');

            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update contact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Edit Contact</DialogTitle>
                    <DialogDescription>
                        Update contact details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate}>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='email' className='text-right'>
                                Email
                            </Label>
                            <Input
                                id='email'
                                name='email'
                                type='email'
                                value={form.email}
                                onChange={handleChange}
                                className='col-span-3'
                                required
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='firstName' className='text-right'>
                                First Name
                            </Label>
                            <Input
                                id='firstName'
                                name='firstName'
                                value={form.firstName}
                                onChange={handleChange}
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='lastName' className='text-right'>
                                Last Name
                            </Label>
                            <Input
                                id='lastName'
                                name='lastName'
                                value={form.lastName}
                                onChange={handleChange}
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='tags' className='text-right'>
                                Tags
                            </Label>
                            <Input
                                id='tags'
                                name='tags'
                                value={form.tags}
                                onChange={handleChange}
                                className='col-span-3'
                                placeholder='Comma separated'
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='submit' disabled={loading}>
                            {loading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
