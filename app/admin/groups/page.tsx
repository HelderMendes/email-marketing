import { prisma } from '@/lib/prisma';
import { GroupsClient } from './groups-client';

async function getGroups() {
    return prisma.contactGroup.findMany({
        include: {
            _count: { select: { contacts: true } },
        },
        orderBy: { name: 'asc' },
    });
}

export default async function GroupsPage() {
    const groups = await getGroups();

    const serializedGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        color: g.color,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        _count: g._count,
    }));

    return (
        <div className='container mx-auto py-10'>
            <GroupsClient groups={serializedGroups} />
        </div>
    );
}
