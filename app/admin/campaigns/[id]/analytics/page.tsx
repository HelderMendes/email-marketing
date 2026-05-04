import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Eye, MousePointer, UserMinus } from 'lucide-react';

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
    const totalUnsubscribed = campaign.emails.filter((e) => e.unsubscribedAt).length;
    
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
    const unsubscribeRate = totalSent > 0 ? ((totalUnsubscribed / totalSent) * 100).toFixed(1) : '0';

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
                            <p className='text-xs text-gray-500'>{openRate}% rate</p>
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
                            <p className='text-xs text-gray-500'>{clickRate}% rate</p>
                        </div>
                    </div>
                </div>
                
                <div className='bg-white p-6 rounded-lg shadow border'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-red-100 rounded-lg'>
                            <UserMinus className='h-5 w-5 text-red-600' />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Unsubscribed</p>
                            <p className='text-2xl font-bold'>{totalUnsubscribed}</p>
                            <p className='text-xs text-gray-500'>{unsubscribeRate}% rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipient Details */}
            <div className='bg-white rounded-lg shadow border'>
                <div className='p-4 border-b'>
                    <h2 className='font-semibold'>Recipient Activity</h2>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='text-left p-4 text-sm font-medium text-gray-600'>Email</th>
                                <th className='text-left p-4 text-sm font-medium text-gray-600'>Status</th>
                                <th className='text-left p-4 text-sm font-medium text-gray-600'>Opened</th>
                                <th className='text-left p-4 text-sm font-medium text-gray-600'>Clicks</th>
                                <th className='text-left p-4 text-sm font-medium text-gray-600'>Unsubscribed</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y'>
                            {campaign.emails.map((email) => (
                                <tr key={email.id} className='hover:bg-gray-50'>
                                    <td className='p-4'>
                                        <div>
                                            <p className='font-medium'>{email.contact.email}</p>
                                            <p className='text-sm text-gray-500'>
                                                {[email.contact.firstName, email.contact.lastName].filter(Boolean).join(' ')}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='p-4'>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            email.status === 'CLICKED' ? 'bg-purple-100 text-purple-700' :
                                            email.status === 'OPENED' ? 'bg-green-100 text-green-700' :
                                            email.status === 'UNSUBSCRIBED' ? 'bg-red-100 text-red-700' :
                                            email.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {email.status}
                                        </span>
                                    </td>
                                    <td className='p-4 text-sm'>
                                        {email.openedAt 
                                            ? new Date(email.openedAt).toLocaleString('nl-NL', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })
                                            : '-'}
                                    </td>
                                    <td className='p-4 text-sm'>
                                        {email.clickCount > 0 ? (
                                            <span className='font-medium'>{email.clickCount} clicks</span>
                                        ) : '-'}
                                    </td>
                                    <td className='p-4 text-sm'>
                                        {email.unsubscribedAt 
                                            ? new Date(email.unsubscribedAt).toLocaleString('nl-NL', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                            {campaign.emails.length === 0 && (
                                <tr>
                                    <td colSpan={5} className='p-8 text-center text-gray-500'>
                                        No emails sent yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
