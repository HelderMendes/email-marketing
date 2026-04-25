import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditForm } from './edit-form';

export default async function CampaignEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [campaign, groups] = await Promise.all([
        prisma.campaign.findUnique({
            where: { id: parseInt(id) },
        }),
        prisma.contactGroup.findMany({
            include: { _count: { select: { contacts: true } } },
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!campaign) {
        notFound();
    }

    const serializedGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        _count: g._count,
    }));

    return <EditForm campaign={campaign} groups={serializedGroups} />;
}
