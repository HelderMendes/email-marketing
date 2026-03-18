import { prisma } from '@/lib/prisma';
import { columns } from './columns';
import { SerializedCampaign } from './types';
import { DataTable } from '@/components/ui/data-table';
import { CreateCampaignButton } from './create-campaign-button';

async function getCampaigns(): Promise<SerializedCampaign[]> {
    const data = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return data.map((c) => ({
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
                <CreateCampaignButton />
            </div>
            <DataTable columns={columns} data={data} searchKey='name' />
        </div>
    );
}
