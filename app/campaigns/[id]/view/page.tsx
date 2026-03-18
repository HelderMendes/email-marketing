import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { renderEmailHtml, EmailTheme } from '@/lib/email-renderer';

export default async function ViewCampaignPage({
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

    const html = renderEmailHtml(
        campaign.htmlContent || '',
        (campaign.theme as unknown as EmailTheme) || undefined,
    );

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
