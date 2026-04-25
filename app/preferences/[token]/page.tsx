import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import PreferenceForm from './preference-form';

export default async function PreferencePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const contact = await prisma.contact.findUnique({
        where: { unsubscribeToken: token },
    });

    if (!contact) {
        notFound();
    }

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
            <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-8'>
                <div className='text-center mb-6 border-b '>
                    <Image
                        src='/logo_LookoutMode_black.png'
                        alt='LOOK OUT Mode'
                        width={380}
                        height={80}
                        className='mx-auto'
                        priority
                    />
                </div>
                <h2 className='text-xl font-medium mb-6'>Update Preferences</h2>
                <div className='space-y-6'>
                    <div className='space-y-2'>
                        <h3 className='font-bold'>Contact Information</h3>
                        <PreferenceForm contact={contact} token={token} />
                    </div>
                </div>
            </div>
        </div>
    );
}
