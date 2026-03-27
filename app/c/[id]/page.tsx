import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { renderEmailHtml, type EmailTheme } from '@/lib/email-renderer';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
        return { title: 'Campaign Not Found' };
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { name: true, subject: true },
    });

    if (!campaign) {
        return { title: 'Campaign Not Found' };
    }

    return {
        title: campaign.subject || campaign.name,
        description: `View the ${campaign.name} email campaign`,
        openGraph: {
            title: campaign.subject || campaign.name,
            description: `View the ${campaign.name} email campaign`,
            type: 'article',
        },
        twitter: {
            card: 'summary',
            title: campaign.subject || campaign.name,
            description: `View the ${campaign.name} email campaign`,
        },
    };
}

export default async function PublicCampaignPage({ params }: Props) {
    const { id } = await params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
        notFound();
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
    });

    if (!campaign) {
        notFound();
    }

    const theme = (campaign.theme as unknown as EmailTheme) || undefined;
    // Don't show "view in browser" link since we're already on the public page
    const htmlContent = renderEmailHtml(campaign.htmlContent || '', theme);

    return (
        <html>
            <head>
                <meta charSet='utf-8' />
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1'
                />
                <title>{campaign.subject || campaign.name}</title>
            </head>
            <body
                style={{ margin: 0, padding: 0 }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </html>
    );
}
