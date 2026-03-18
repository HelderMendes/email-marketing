'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function PreferenceForm({
    contact,
    token,
}: {
    contact: {
        email: string;
        firstName: string | null;
        lastName: string | null;
        status: string;
    };
    token: string;
}) {
    const [firstName, setFirstName] = useState(contact.firstName || '');
    const [lastName, setLastName] = useState(contact.lastName || '');
    const [status, setStatus] = useState(contact.status);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/preferences/${token}`, {
                method: 'PATCH',
                body: JSON.stringify({ firstName, lastName, status }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                alert('Preferences updated!');
                router.refresh();
            } else {
                alert('Failed to update preferences');
            }
        } catch (e) {
            alert('Error updating preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                    id='email'
                    value={contact.email}
                    disabled
                    className='bg-gray-100'
                />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                        id='firstName'
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                        id='lastName'
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
            </div>

            <div className='space-y-2'>
                <Label>Newsletter Status</Label>
                <div className='flex items-center space-x-2'>
                    <input
                        type='checkbox'
                        id='subscribed'
                        checked={status === 'SUBSCRIBED'}
                        onChange={(e) =>
                            setStatus(
                                e.target.checked
                                    ? 'SUBSCRIBED'
                                    : 'UNSUBSCRIBED',
                            )
                        }
                        className='h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded'
                    />
                    <label
                        htmlFor='subscribed'
                        className='text-sm text-gray-700'
                    >
                        I want to receive emails from Look Out Mode (Subscribed)
                    </label>
                </div>
            </div>

            <div className='pt-4'>
                <Button type='submit' disabled={loading} className='w-full'>
                    {loading ? 'Updating...' : 'Update Preferences'}
                </Button>
            </div>
        </form>
    );
}
