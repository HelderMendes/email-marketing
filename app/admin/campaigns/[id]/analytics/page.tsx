import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Eye, MousePointer, UserMinus } from 'lucide-react';
import { AnalyticsTable } from './analytics-table';

export default async function CampaignAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const campaignId = parseInt(id);

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            emails: {
                include: {
                    contact: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    clicks: true,
                },
                orderBy: { sentAt: 'desc' },
            },
        },
    });

    if (!campaign) {
        notFound();
    }

    // Calculate stats
    const totalSent = campaign.emails.length;
    const totalOpened = campaign.emails.filter((e) => e.openedAt).length;
    const totalClicked = campaign.emails.filter((e) => e.clickedAt).length;
    const totalUnsubscribed = campaign.emails.filter(
        (e) => e.unsubscribedAt,
    ).length;

    const openRate =
        totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
    const clickRate =
        totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
    const unsubscribeRate =
        totalSent > 0
            ? ((totalUnsubscribed / totalSent) * 100).toFixed(1)
            : '0';

    return (
        <div className='container mx-auto p-6 max-w-6xl'>
            <div className='mb-6'>
                <Link
                    href='/admin/campaigns'
                    className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4'
                >
                    <ArrowLeft className='h-4 w-4 mr-1' />
                    Back to Campaigns
                </Link>
                <h1 className='text-2xl font-bold'>{campaign.name}</h1>
                <p className='text-gray-600'>Campaign Analytics</p>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
                <div className='bg-white p-6 rounded-lg shadow border'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                            <Mail className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Sent</p>
                            <p className='text-2xl font-bold'>{totalSent}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow border'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <Eye className='h-5 w-5 text-green-600' />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Opened</p>
                            <p className='text-2xl font-bold'>{totalOpened}</p>
                            <p className='text-xs text-gray-500'>
                                {openRate}% rate
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow border'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-purple-100 rounded-lg'>
                            <MousePointer className='h-5 w-5 text-purple-600' />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Clicked</p>
                            <p className='text-2xl font-bold'>{totalClicked}</p>
                            <p className='text-xs text-gray-500'>
                                {clickRate}% rate
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow border'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-red-100 rounded-lg'>
                            <UserMinus className='h-5 w-5 text-red-600' />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>
                                Unsubscribed
                            </p>
                            <p className='text-2xl font-bold'>
                                {totalUnsubscribed}
                            </p>
                            <p className='text-xs text-gray-500'>
                                {unsubscribeRate}% rate
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipient Details */}
            <div className='bg-white rounded-lg shadow border'>
                <div className='p-4 border-b'>
                    <h2 className='font-semibold'>Recipient Activity</h2>
                </div>
                <AnalyticsTable
                    emails={campaign.emails.map((email) => ({
                        id: email.id,
                        contactEmail: email.contact.email,
                        contactName: [
                            email.contact.firstName,
                            email.contact.lastName,
                        ]
                            .filter(Boolean)
                            .join(' '),
                        status: email.status,
                        openedAt: email.openedAt?.toISOString() ?? null,
                        clickedAt: email.clickedAt?.toISOString() ?? null,
                        clickCount: email.clickCount,
                        unsubscribedAt:
                            email.unsubscribedAt?.toISOString() ?? null,
                        sentAt: email.sentAt?.toISOString() ?? null,
                    }))}
                />
            </div>
        </div>
    );
}
