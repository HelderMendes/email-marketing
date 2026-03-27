'use client';

import * as React from 'react';
import { useState } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
    OnChangeFn,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    rowSelection?: Record<string, boolean>;
    setRowSelection?: React.Dispatch<
        React.SetStateAction<Record<string, boolean>>
    >;
    searchKey?: string;
    showPagination?: boolean;
    manualPagination?: boolean;
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    rowSelection: externalRowSelection,
    setRowSelection: externalSetRowSelection,
    searchKey,
    showPagination = true,
    manualPagination = false,
    sorting: externalSorting,
    onSortingChange: externalOnSortingChange,
    onRowClick,
}: DataTableProps<TData, TValue>) {
    'use no memo';
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [internalRowSelection, setInternalRowSelection] = useState<
        Record<string, boolean>
    >({});

    const rowSelection = externalRowSelection ?? internalRowSelection;
    const setRowSelection = externalSetRowSelection ?? setInternalRowSelection;

    // Handle controlled sorting
    const finalSorting = externalSorting ?? sorting;
    const finalOnSortingChange = externalOnSortingChange ?? setSorting;
    const manualSorting = !!externalSorting;

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: manualPagination
            ? undefined
            : getPaginationRowModel(),
        onSortingChange: finalOnSortingChange,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        manualSorting,
        state: {
            sorting: finalSorting,
            columnFilters,
            rowSelection,
        },
    });

    return (
        <div>
            <div className='flex items-center py-4'>
                {searchKey && (
                    <Input
                        placeholder={`Filter ${searchKey}...`}
                        value={
                            (table
                                .getColumn(searchKey)
                                ?.getFilterValue() as string) ?? ''
                        }
                        onChange={(event) =>
                            table
                                .getColumn(searchKey)
                                ?.setFilterValue(event.target.value)
                        }
                        className='max-w-sm'
                    />
                )}
            </div>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    onClick={() => onRowClick?.(row.original)}
                                    className={
                                        onRowClick
                                            ? 'cursor-pointer hover:bg-muted/50'
                                            : ''
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {showPagination && (
                <div className='flex items-center justify-end space-x-2 py-4'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
