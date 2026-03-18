'use client';

import { useState, useEffect } from 'react';
import { columns } from './columns';
import { SerializedContact } from './types';
import { DataTable } from '@/components/ui/data-table';
import { ContactActions } from './contact-actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SortingState, OnChangeFn } from '@tanstack/react-table';

interface ContactsClientProps {
    data: SerializedContact[];
    pageSize?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export function ContactsClient({
    data,
    pageSize = 10,
    sort = 'createdAt',
    order = 'desc',
}: ContactsClientProps) {
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
        {},
    );
    const router = useRouter();
    const searchParams = useSearchParams();

    // Clear selection when data (page) changes to prevent accidental actions
    useEffect(() => {
        setRowSelection({});
    }, [data]);

    const sorting: SortingState = [{ id: sort, desc: order === 'desc' }];

    const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
        const newSorting =
            typeof updaterOrValue === 'function'
                ? updaterOrValue(sorting)
                : updaterOrValue;

        const first = newSorting[0];
        const params = new URLSearchParams(searchParams.toString());

        // Reset to page 1 on sort change
        params.set('page', '1');

        if (first) {
            params.set('sort', first.id);
            params.set('order', first.desc ? 'desc' : 'asc');
        } else {
            // If cleared, fallback to default (createdAt desc) or remove params
            params.delete('sort');
            params.delete('order');
        }

        router.push(`/admin/contacts?${params.toString()}`);
    };

    const handlePageSizeChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        params.set('pageSize', value);
        router.push(`/admin/contacts?${params.toString()}`);
    };

    const selectedIds = Object.keys(rowSelection)
        .filter((k) => rowSelection[k])
        .map((k) => {
            const index = parseInt(k);
            return data[index]?.id;
        })
        .filter((id) => id !== undefined);

    const handleBulkDelete = async () => {
        if (
            !confirm(
                `Are you sure you want to delete ${selectedIds.length} contacts?`,
            )
        )
            return;

        try {
            await fetch('/api/contacts', {
                method: 'DELETE',
                body: JSON.stringify({ ids: selectedIds }),
                headers: { 'Content-Type': 'application/json' },
            });
            setRowSelection({});
            router.refresh();
        } catch (error) {
            alert('Failed to delete contacts');
        }
    };

    return (
        <div>
            <div className='flex justify-between items-center mb-4 gap-4'>
                <h1 className='text-2xl font-bold'>Contacts Administration</h1>
                <div className='flex gap-2 items-center'>
                    <div className='flex items-center gap-2'>
                        <span className='text-sm'>Rows per page:</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={handlePageSizeChange}
                        >
                            <SelectTrigger className='w-[80px]'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='10'>10</SelectItem>
                                <SelectItem value='20'>20</SelectItem>
                                <SelectItem value='50'>50</SelectItem>
                                <SelectItem value='100'>100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className='flex gap-2 mr-4 animate-in fade-in'>
                            <Button
                                variant='destructive'
                                onClick={handleBulkDelete}
                                size='sm'
                            >
                                <Trash2 className='mr-2 h-4 w-4' /> Delete (
                                {selectedIds.length})
                            </Button>
                        </div>
                    )}
                    <ContactActions />
                </div>
            </div>
            <DataTable
                columns={columns}
                data={data}
                searchKey='email'
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                showPagination={false}
                manualPagination={true}
                sorting={sorting}
                onSortingChange={handleSortingChange}
            />
        </div>
    );
}
