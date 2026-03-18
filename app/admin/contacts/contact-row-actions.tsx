'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SerializedContact } from './types';
import { Checkbox } from '@/components/ui/checkbox';

interface ContactRowActionsProps {
    contact: SerializedContact;
}

export function ContactRowActions({ contact }: ContactRowActionsProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        tags: contact.tags || '',
        status: contact.status,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Failed to update contact');

            setDialogOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update contact');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const res = await fetch(`/api/contacts?id=${contact.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete contact');

            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete contact');
        }
    };

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => {
                            setOpen(false);
                            setDialogOpen(true);
                        }}
                    >
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setOpen(false);
                            handleDelete();
                        }}
                        className='text-red-600'
                    >
                        <Trash className='mr-2 h-4 w-4' />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                <Label
                                    htmlFor='firstName'
                                    className='text-right'
                                >
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
                                <Label
                                    htmlFor='lastName'
                                    className='text-right'
                                >
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
        </>
    );
}
