import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className='flex min-h-screen flex-col'>
            <header className='sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6'>
                <Link
                    href='/admin'
                    className='font-semibold text-lg flex items-center gap-2'
                >
                    Look Out Mail
                </Link>
                <nav className='flex items-center gap-6 ml-6'>
                    <Link
                        href='/admin/contacts'
                        className='text-sm font-medium hover:underline'
                    >
                        Contacts
                    </Link>
                    <Link
                        href='/admin/campaigns'
                        className='text-sm font-medium hover:underline'
                    >
                        Campaigns
                    </Link>
                </nav>
                <div className='ml-auto flex items-center gap-4'>
                    <Button variant='ghost' asChild>
                        <Link href='/'>Public View</Link>
                    </Button>
                </div>
                <div className='ml-auto flex items-center gap-4'>
                    <ModeToggle />
                </div>
            </header>
            <main className='flex-1 p-6 md:p-8'>{children}</main>
        </div>
    );
}
