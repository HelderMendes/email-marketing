'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
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
            const scheduledAt = row.original.scheduledAt;

            if (status === 'SCHEDULED' && scheduledAt) {
                const date = new Date(scheduledAt);
                const formatted = date.toLocaleString('nl-NL', {
                    timeZone: 'Europe/Amsterdam',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                return (
                    <div className='flex items-center gap-2'>
                        <Badge
                            variant='outline'
                            className='bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                        >
                            <Clock className='mr-1 h-3 w-3' />
                            SCHEDULED
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                            {formatted}
                        </span>
                    </div>
                );
            }

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
