'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <Button variant='ghost' size='sm' onClick={handleLogout}>
            <LogOut className='w-4 h-4 mr-2' />
            Logout
        </Button>
    );
}
