'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@prisma/client';

// This type is used to define the shape of our data.
export type SerializedContact = Omit<Contact, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export const columns: ColumnDef<SerializedContact>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label='Select all'
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label='Select row'
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'email',
        header: 'E-mailadres',
    },
    {
        accessorKey: 'firstName',
        header: 'Voornaam',
    },
    {
        accessorKey: 'lastName',
        header: 'Achternaam',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
                <Badge
                    variant={
                        status === 'SUBSCRIBED' ? 'default' : 'destructive'
                    }
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'source',
        header: 'Source',
    },
    {
        accessorKey: 'createdAt',
        header: 'Contact Date Added',
        cell: ({ row }) => {
            return new Date(row.getValue('createdAt')).toLocaleDateString();
        },
    },
    {
        accessorKey: 'updatedAt',
        header: 'Last Changed',
        cell: ({ row }) => {
            return new Date(row.getValue('updatedAt')).toLocaleDateString();
        },
    },
];
