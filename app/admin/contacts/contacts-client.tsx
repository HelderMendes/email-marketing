'use client';

import { useState, useEffect, useCallback } from 'react';
import { columns } from './columns';
import { SerializedContact } from './types';
import { DataTable } from '@/components/ui/data-table';
import { ContactActions } from './contact-actions';
import { EditContactDialog } from './edit-contact-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, X, Users, UserPlus, UserMinus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SortingState, OnChangeFn } from '@tanstack/react-table';

type GroupWithCount = {
    id: number;
    name: string;
    color: string | null;
    _count: { contacts: number };
};

interface ContactsClientProps {
    data: SerializedContact[];
    pageSize?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    groupId?: number;
    groups?: GroupWithCount[];
    totalCount?: number;
}

export function ContactsClient({
    data,
    pageSize = 10,
    sort = 'createdAt',
    order = 'desc',
    search = '',
    groupId,
    groups = [],
    totalCount = 0,
}: ContactsClientProps) {
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
        {},
    );
    const [selectedContact, setSelectedContact] =
        useState<SerializedContact | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(search);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== search) {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', '1');
                if (searchInput.trim()) {
                    params.set('search', searchInput.trim());
                } else {
                    params.delete('search');
                }
                router.push(`/admin/contacts?${params.toString()}`);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, search, searchParams, router]);

    const handleGroupFilter = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', '1');
            if (value && value !== 'all') {
                params.set('groupId', value);
            } else {
                params.delete('groupId');
            }
            router.push(`/admin/contacts?${params.toString()}`);
        },
        [searchParams, router],
    );

    const clearFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (pageSize !== 10) params.set('pageSize', pageSize.toString());
        router.push(`/admin/contacts?${params.toString()}`);
        setSearchInput('');
    }, [pageSize, router]);

    // Generate a key from data to reset selection when page changes
    const dataKey = data.map((c) => c.id).join(',');

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
        } catch {
            alert('Failed to delete contacts');
        }
    };

    const handleAddToGroup = async (targetGroupId: string) => {
        if (!targetGroupId || targetGroupId === 'select') return;

        try {
            const res = await fetch(`/api/groups/${targetGroupId}/contacts`, {
                method: 'POST',
                body: JSON.stringify({ contactIds: selectedIds }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.error || 'Failed to add contacts to group',
                );
            }

            setRowSelection({});
            router.refresh();
        } catch (err) {
            alert(
                err instanceof Error ? err.message : 'Failed to add to group',
            );
        }
    };

    const handleRemoveFromGroup = async (targetGroupId: string) => {
        if (!targetGroupId || targetGroupId === 'select') return;

        try {
            const res = await fetch(`/api/groups/${targetGroupId}/contacts`, {
                method: 'DELETE',
                body: JSON.stringify({ contactIds: selectedIds }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.error || 'Failed to remove contacts from group',
                );
            }

            setRowSelection({});
            router.refresh();
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : 'Failed to remove from group',
            );
        }
    };

    const hasFilters = search || groupId;

    return (
        <div>
            <div className='flex justify-between items-center mb-4 gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>
                        Contacts Administration
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                        {totalCount} contact{totalCount !== 1 ? 's' : ''} total
                        {hasFilters && ' (filtered)'}
                    </p>
                </div>
                <div className='flex gap-2 items-center'>
                    <ContactActions />
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className='flex flex-wrap gap-3 mb-4 items-center'>
                <div className='relative flex-1 min-w-[200px] max-w-sm'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder='Search email, name...'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className='pl-9'
                    />
                    {searchInput && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0'
                            onClick={() => setSearchInput('')}
                        >
                            <X className='h-3 w-3' />
                        </Button>
                    )}
                </div>

                <Select
                    value={groupId?.toString() || 'all'}
                    onValueChange={handleGroupFilter}
                >
                    <SelectTrigger className='w-[180px]'>
                        <Users className='h-4 w-4 mr-2' />
                        <SelectValue placeholder='All Groups' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All Groups</SelectItem>
                        {groups.map((group) => (
                            <SelectItem
                                key={group.id}
                                value={group.id.toString()}
                            >
                                <span
                                    className='inline-block w-2 h-2 rounded-full mr-2'
                                    style={{
                                        backgroundColor:
                                            group.color || '#6366f1',
                                    }}
                                />
                                {group.name} ({group._count.contacts})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>Rows:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={handlePageSizeChange}
                    >
                        <SelectTrigger className='w-[70px]'>
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

                {hasFilters && (
                    <Button variant='outline' size='sm' onClick={clearFilters}>
                        <X className='h-3 w-3 mr-1' /> Clear Filters
                    </Button>
                )}

                {selectedIds.length > 0 && (
                    <>
                        <Select onValueChange={handleAddToGroup}>
                            <SelectTrigger className='w-[160px]'>
                                <UserPlus className='h-4 w-4 mr-2' />
                                <SelectValue placeholder='Add to Group' />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.length === 0 ? (
                                    <SelectItem value='none' disabled>
                                        No groups created
                                    </SelectItem>
                                ) : (
                                    groups.map((group) => (
                                        <SelectItem
                                            key={group.id}
                                            value={group.id.toString()}
                                        >
                                            <span
                                                className='inline-block w-2 h-2 rounded-full mr-2'
                                                style={{
                                                    backgroundColor:
                                                        group.color ||
                                                        '#6366f1',
                                                }}
                                            />
                                            {group.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={handleRemoveFromGroup}>
                            <SelectTrigger className='w-[180px]'>
                                <UserMinus className='h-4 w-4 mr-2' />
                                <SelectValue placeholder='Remove from Group' />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.length === 0 ? (
                                    <SelectItem value='none' disabled>
                                        No groups created
                                    </SelectItem>
                                ) : (
                                    groups.map((group) => (
                                        <SelectItem
                                            key={group.id}
                                            value={group.id.toString()}
                                        >
                                            <span
                                                className='inline-block w-2 h-2 rounded-full mr-2'
                                                style={{
                                                    backgroundColor:
                                                        group.color ||
                                                        '#6366f1',
                                                }}
                                            />
                                            {group.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            variant='destructive'
                            onClick={handleBulkDelete}
                            size='sm'
                        >
                            <Trash2 className='mr-2 h-4 w-4' /> Delete (
                            {selectedIds.length})
                        </Button>
                    </>
                )}
            </div>

            <DataTable
                key={dataKey}
                columns={columns}
                data={data}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                showPagination={false}
                manualPagination={true}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                onRowClick={(contact) => {
                    setSelectedContact(contact);
                    setEditDialogOpen(true);
                }}
            />

            <EditContactDialog
                contact={selectedContact}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
