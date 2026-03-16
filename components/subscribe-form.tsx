'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function SubscribeForm() {
    const [isLoading, setIsLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email, firstName, lastName }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to subscribe');
            }

            alert('Bedankt voor het abonneren!');
            event.currentTarget.reset();
        } catch (error) {
            alert('Er ging iets mis. Probeer het later opnieuw.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='w-full max-w-md mx-auto p-6 md:p-8 border-2 border-[#8B4513] rounded-sm bg-[#fff8e1] shadow-lg font-sans'>
            <div className='text-center mb-6'>
                <h2 className='text-3xl font-serif tracking-widest text-[#2c1810]'>
                    LOOK OUT
                </h2>
            </div>

            <div className='border border-dashed border-gray-400 p-2 mb-6 text-sm text-center text-gray-700 bg-white/50'>
                Lijst voor aanbiedingen, nieuwtjes en speciale offers
            </div>

            <form onSubmit={onSubmit} className='space-y-6'>
                <div className='space-y-2'>
                    <Label
                        htmlFor='email'
                        className='text-teal-600 font-bold text-base block'
                    >
                        E-mailadres
                    </Label>
                    <Input
                        id='email'
                        name='email'
                        type='email'
                        required
                        className='bg-white border-gray-300 rounded-none h-10 shadow-sm text-base'
                    />
                </div>

                <div className='space-y-2'>
                    <Label
                        htmlFor='firstName'
                        className='text-teal-600 font-bold text-base block'
                    >
                        Voornaam
                    </Label>
                    <Input
                        id='firstName'
                        name='firstName'
                        type='text'
                        className='bg-white border-gray-300 rounded-none h-10 shadow-sm text-base'
                    />
                </div>

                <div className='space-y-2'>
                    <Label
                        htmlFor='lastName'
                        className='text-teal-600 font-bold text-base block'
                    >
                        Achternaam
                    </Label>
                    <Input
                        id='lastName'
                        name='lastName'
                        type='text'
                        className='bg-white border-gray-300 rounded-none h-10 shadow-sm text-base'
                    />
                </div>

                <Button
                    type='submit'
                    disabled={isLoading}
                    className='bg-teal-600 hover:bg-teal-700 text-white rounded-sm px-6 py-2 h-auto text-base font-medium shadow-sm'
                >
                    {isLoading && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Abonneren
                </Button>
            </form>
        </div>
    );
}
