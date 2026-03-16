import { prisma } from '@/lib/prisma';
import { columns, SerializedCampaign } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Campaign } from '@prisma/client';

async function getCampaigns(): Promise<SerializedCampaign[]> {
    const data = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return data.map((c: Campaign) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sentAt: c.sentAt ? c.sentAt.toISOString() : null,
        scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
    }));
}

export default async function CampaignsPage() {
    const data = await getCampaigns();

    return (
        <div className='container mx-auto py-10'>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-bold'>Campaigns Administration</h1>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
}
