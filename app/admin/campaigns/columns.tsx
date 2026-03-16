'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Copy, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export type SerializedCampaign = {
    id: number;
    name: string;
    status: string;
    sentAt: string | null;
    scheduledAt: string | null;
    createdAt: string;
};

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
            return d ? new Date(d as string).toLocaleDateString() : '-';
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const campaign = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    campaign.id.toString(),
                                )
                            }
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/campaigns/${campaign.id}/view`}
                                target='_blank'
                            >
                                <Eye className='mr-2 h-4 w-4' /> View Email
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                fetch(
                                    `/api/campaigns/${campaign.id}/replicate`,
                                    { method: 'POST' },
                                ).then(() => window.location.reload());
                            }}
                        >
                            <Copy className='mr-2 h-4 w-4' /> Replicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit className='mr-2 h-4 w-4' /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => {
                                if (confirm('Delete campaign?')) {
                                    fetch(`/api/campaigns/${campaign.id}`, {
                                        method: 'DELETE',
                                    }).then(() => window.location.reload());
                                }
                            }}
                        >
                            <Trash className='mr-2 h-4 w-4' /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
