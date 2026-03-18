import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function UnsubscribePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    // Find contact
    const contact = await prisma.contact.findUnique({
        where: { unsubscribeToken: token },
    });

    if (!contact) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-center p-8 bg-white shadow rounded-lg'>
                    <h1 className='text-2xl font-bold text-red-600 mb-4'>
                        Invalid Link
                    </h1>
                    <p>We could not find your subscription details.</p>
                    <Link
                        href='/'
                        className='text-blue-600 hover:underline mt-4 block'
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    // Process unsubscribe
    await prisma.contact.update({
        where: { id: contact.id },
        data: { status: 'UNSUBSCRIBED', updatedAt: new Date() },
    });

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 font-sans'>
            <div className='max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center border-t-4 border-red-500'>
                <h1 className='text-3xl font-bold text-gray-800 mb-6'>
                    Unsubscribed
                </h1>
                <p className='text-gray-600 mb-8'>
                    You have been successfully unsubscribed from our mailing
                    list. We are sorry to see you go!
                </p>
                <div className='space-y-4'>
                    <p className='text-sm text-gray-500'>
                        Mistake?{' '}
                        <Link
                            href={`/preferences/${token}`}
                            className='text-blue-600 hover:underline'
                        >
                            Resubscribe here
                        </Link>
                        .
                    </p>
                    <Link
                        href='/'
                        className='inline-block px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors'
                    >
                        Return to Website
                    </Link>
                </div>
            </div>
        </div>
    );
}
