'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function SubscribeForm() {
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Basic spam protection (honeypot)
        const formData = new FormData(event.currentTarget);
        const honeypot = formData.get('website_url'); // Hidden field

        if (honeypot) {
            // Silently succeed for bots
            alert('Bedankt voor het abonneren!');
            formRef.current?.reset();
            return;
        }

        setIsLoading(true);
        const email = formData.get('email') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const consent = formData.get('consent') === 'on';

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email, firstName, lastName, consent }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to subscribe');
            }

            alert('Bedankt voor het abonneren!');
            formRef.current?.reset();
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

            <form ref={formRef} onSubmit={onSubmit} className='space-y-6'>
                {/* Honeypot field for spam protection */}
                <div style={{ display: 'none' }} aria-hidden='true'>
                    <label htmlFor='website_url'>Website</label>
                    <input
                        type='text'
                        name='website_url'
                        id='website_url'
                        tabIndex={-1}
                        autoComplete='off'
                    />
                </div>

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

                <div className='flex items-start space-x-2'>
                    <input
                        type='checkbox'
                        id='consent'
                        name='consent'
                        required
                        className='mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500'
                    />
                    <Label
                        htmlFor='consent'
                        className='text-sm text-gray-700 leading-tight font-normal'
                    >
                        Ik wil graag op de hoogte blijven van de laatste
                        nieuwtjes, leuke acties en gave nieuwe collecties van
                        LOOK OUT Mode.
                    </Label>
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
