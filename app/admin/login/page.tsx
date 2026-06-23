'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, Key } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [usePassword, setUsePassword] = useState(false);

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handlePassword(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/admin');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
                <Card className='w-full max-w-md'>
                    <CardHeader className='text-center'>
                        <div className='mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                            <CheckCircle className='w-6 h-6 text-green-600' />
                        </div>
                        <CardTitle className='text-2xl'>
                            Check your email
                        </CardTitle>
                        <CardDescription>
                            We sent a login link to <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='text-center text-sm text-muted-foreground'>
                        Click the link in the email to access the admin area.
                        <br />
                        The link expires in 15 minutes.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <div className='mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                        {usePassword ? (
                            <Key className='w-6 h-6 text-primary' />
                        ) : (
                            <Mail className='w-6 h-6 text-primary' />
                        )}
                    </div>
                    <CardTitle className='text-2xl'>Admin Login</CardTitle>
                    <CardDescription>
                        {usePassword
                            ? 'Login with email and password'
                            : 'Enter your email to receive a login link'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={
                            usePassword ? handlePassword : handleMagicLink
                        }
                        className='space-y-4'
                    >
                        {error && (
                            <Alert variant='destructive'>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className='space-y-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                id='email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='your@email.com'
                                required
                                autoFocus
                            />
                        </div>
                        {usePassword && (
                            <div className='space-y-2'>
                                <Label htmlFor='password'>Password</Label>
                                <Input
                                    id='password'
                                    type='password'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder='••••••••'
                                    required
                                />
                            </div>
                        )}
                        <Button
                            type='submit'
                            className='w-full'
                            disabled={loading}
                        >
                            {loading
                                ? 'Loading...'
                                : usePassword
                                  ? 'Login'
                                  : 'Send Login Link'}
                        </Button>
                    </form>
                    <div className='mt-4 text-center'>
                        <button
                            type='button'
                            onClick={() => {
                                setUsePassword(!usePassword);
                                setError('');
                            }}
                            className='text-sm text-muted-foreground hover:text-primary underline'
                        >
                            {usePassword
                                ? 'Use magic link instead'
                                : 'Login with password'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
