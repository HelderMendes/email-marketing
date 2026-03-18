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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

export function CreateContactDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        tags: '',
        status: 'SUBSCRIBED',
        source: 'MANUAL',
        consentGiven: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (checked: boolean) => {
        setForm({ ...form, consentGiven: checked });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Failed to create contact');

            setOpen(false);
            router.refresh();
            setForm({
                email: '',
                firstName: '',
                lastName: '',
                tags: '',
                status: 'SUBSCRIBED',
                source: 'MANUAL',
                consentGiven: false,
            });
        } catch (error) {
            console.error(error);
            alert('Failed to create contact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                        Manually add a new contact to your list.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
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
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label
                                htmlFor='consentGiven'
                                className='text-right'
                            >
                                Consent
                            </Label>
                            <div className='flex items-center space-x-2 col-span-3'>
                                <Checkbox
                                    id='consentGiven'
                                    checked={form.consentGiven}
                                    onCheckedChange={handleCheckboxChange}
                                />
                                <label
                                    htmlFor='consentGiven'
                                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                >
                                    User has explicitly consented
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='submit' disabled={loading}>
                            {loading ? 'Adding...' : 'Add Contact'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
