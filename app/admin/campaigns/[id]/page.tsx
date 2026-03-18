import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditForm } from './edit-form';

export default async function CampaignEditPage({
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

    return <EditForm campaign={campaign} />;
}
