import { prisma } from '@/lib/prisma';
import { renderEmailHtml, type EmailTheme } from '@/lib/email-renderer';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export default async function Archive() {
    const campaigns = await prisma.campaign.findMany({
        where: { status: 'SENT' },
        orderBy: { sentAt: 'desc' },
        select: {
            id: true,
            name: true,
            sentAt: true,
            subject: true,
            htmlContent: true,
            theme: true,
        },
    });

    return (
        <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100'>
            <div className='container mx-auto py-12 px-4'>
                <div className='text-center mb-12'>
                    <h1 className='text-4xl font-bold mb-3 text-gray-800'>
                        Newsletter Archive
                    </h1>
                    <p className='text-gray-600'>Browse our past newsletters</p>
                </div>

                {campaigns.length === 0 ? (
                    <p className='text-center text-gray-500 py-12'>
                        No newsletters sent yet.
                    </p>
                ) : (
                    <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                        {campaigns.map((campaign) => {
                            const theme =
                                (campaign.theme as unknown as EmailTheme) ||
                                undefined;
                            const previewHtml = renderEmailHtml(
                                campaign.htmlContent || '',
                                theme,
                                { campaignId: campaign.id },
                            );

                            return (
                                <Link
                                    href={`/c/${campaign.id}`}
                                    key={campaign.id}
                                    className='block group'
                                >
                                    <article className='bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200'>
                                        {/* Email Preview */}
                                        <div className='relative h-64 overflow-hidden bg-gray-100 border-b'>
                                            <div className='absolute inset-0 pointer-events-none'>
                                                <iframe
                                                    srcDoc={previewHtml}
                                                    className='w-[200%] h-[200%] origin-top-left scale-50'
                                                    title={`Preview: ${campaign.subject}`}
                                                    scrolling='no'
                                                />
                                            </div>
                                            <div className='absolute inset-0 bg-gradient-to-t from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4'>
                                                <span className='bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium'>
                                                    View Newsletter →
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className='p-5'>
                                            <h2 className='text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition-colors line-clamp-2 mb-2'>
                                                {campaign.subject ||
                                                    campaign.name}
                                            </h2>
                                            <time className='text-sm text-gray-500'>
                                                {campaign.sentAt
                                                    ? new Date(
                                                          campaign.sentAt,
                                                      ).toLocaleDateString(
                                                          'nl-NL',
                                                          {
                                                              year: 'numeric',
                                                              month: 'long',
                                                              day: 'numeric',
                                                          },
                                                      )
                                                    : 'Date unknown'}
                                            </time>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
