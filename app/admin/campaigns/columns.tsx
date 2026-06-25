'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { SerializedCampaign } from './types';
import { ActionsCell } from './actions-cell';

function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export type { SerializedCampaign };

export const columns: ColumnDef<SerializedCampaign>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
                <Badge
                    variant={
                        status === 'SENT'
                            ? 'default'
                            : status === 'DRAFT'
                              ? 'secondary'
                              : 'outline'
                    }
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'sentAt',
        header: 'Sent At',
        cell: ({ row }) => {
            const d = row.getValue('sentAt');
            return d ? formatDate(d as string) : '-';
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => <ActionsCell campaign={row.original} />,
    },
];
