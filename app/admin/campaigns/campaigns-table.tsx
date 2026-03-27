'use client';

import { useRouter } from 'next/navigation';
import { columns } from './columns';
import { SerializedCampaign } from './types';
import { DataTable } from '@/components/ui/data-table';

export function CampaignsTable({ data }: { data: SerializedCampaign[] }) {
    const router = useRouter();

    const handleRowClick = (campaign: SerializedCampaign) => {
        router.push(`/admin/campaigns/${campaign.id}`);
    };

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey='name'
            onRowClick={handleRowClick}
        />
    );
}
