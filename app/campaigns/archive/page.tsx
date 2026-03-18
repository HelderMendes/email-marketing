import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function Archive() {
    const campaigns = await prisma.campaign.findMany({
        where: { status: 'SENT' },
        orderBy: { sentAt: 'desc' },
        select: {
            id: true,
            name: true,
            sentAt: true,
            subject: true,
        },
    });

    return (
        <div className='container mx-auto py-12 px-4 font-sans'>
            <h1 className='text-3xl font-serif text-center mb-10 text-teal-800'>
                Newsletter Archive
            </h1>
            {campaigns.length === 0 ? (
                <p className='text-center text-gray-500'>
                    No newsletters sent yet.
                </p>
            ) : (
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                    {campaigns.map((campaign) => (
                        <Link
                            href={`/campaigns/${campaign.id}/webview`}
                            key={campaign.id}
                            className='block group'
                        >
                            <div className='border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white h-full flex flex-col items-start'>
                                <h2 className='text-xl font-bold mb-3 group-hover:text-teal-600 transition-colors line-clamp-2'>
                                    {campaign.subject || campaign.name}
                                </h2>
                                <p className='text-gray-500 text-sm mt-auto'>
                                    Sent:{' '}
                                    {new Date(
                                        campaign.sentAt!,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
