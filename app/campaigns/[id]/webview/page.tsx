import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EmailFooter } from '@/components/email-footer';

export default async function WebViewCampaignPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(id) },
    });

    if (!campaign) {
        notFound();
    }

    return (
        <div className='max-w-2xl mx-auto bg-white min-h-screen font-sans'>
            <div
                className='p-8'
                dangerouslySetInnerHTML={{ __html: campaign.htmlContent || '' }}
            />
            <div className='border-t border-gray-200 mt-8'>
                <EmailFooter />
            </div>
        </div>
    );
}
