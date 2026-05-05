'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type EmailData = {
    id: number;
    contactEmail: string;
    contactName: string;
    status: string;
    openedAt: string | null;
    clickedAt: string | null;
    clickCount: number;
    unsubscribedAt: string | null;
    sentAt: string | null;
};

type SortKey =
    | 'email'
    | 'status'
    | 'openedAt'
    | 'clicks'
    | 'unsubscribedAt'
    | 'sentAt';
type SortDir = 'asc' | 'desc';

function formatDate(isoString: string | null): string {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function AnalyticsTable({ emails }: { emails: EmailData[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('sentAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const sortedEmails = useMemo(() => {
        return [...emails].sort((a, b) => {
            let comparison = 0;

            switch (sortKey) {
                case 'email':
                    comparison = a.contactEmail.localeCompare(b.contactEmail);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'openedAt':
                    if (!a.openedAt && !b.openedAt) comparison = 0;
                    else if (!a.openedAt) comparison = 1;
                    else if (!b.openedAt) comparison = -1;
                    else
                        comparison =
                            new Date(a.openedAt).getTime() -
                            new Date(b.openedAt).getTime();
                    break;
                case 'clicks':
                    comparison = a.clickCount - b.clickCount;
                    break;
                case 'unsubscribedAt':
                    if (!a.unsubscribedAt && !b.unsubscribedAt) comparison = 0;
                    else if (!a.unsubscribedAt) comparison = 1;
                    else if (!b.unsubscribedAt) comparison = -1;
                    else
                        comparison =
                            new Date(a.unsubscribedAt).getTime() -
                            new Date(b.unsubscribedAt).getTime();
                    break;
                case 'sentAt':
                    if (!a.sentAt && !b.sentAt) comparison = 0;
                    else if (!a.sentAt) comparison = 1;
                    else if (!b.sentAt) comparison = -1;
                    else
                        comparison =
                            new Date(a.sentAt).getTime() -
                            new Date(b.sentAt).getTime();
                    break;
            }

            return sortDir === 'asc' ? comparison : -comparison;
        });
    }, [emails, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const getSortIcon = (columnKey: SortKey) => {
        if (sortKey !== columnKey) {
            return <ArrowUpDown className='ml-1 h-3 w-3 opacity-50' />;
        }
        return sortDir === 'asc' ? (
            <ArrowUp className='ml-1 h-3 w-3' />
        ) : (
            <ArrowDown className='ml-1 h-3 w-3' />
        );
    };

    const headerClass =
        'text-left p-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none';

    return (
        <div className='overflow-x-auto'>
            <table className='w-full'>
                <thead className='bg-gray-50'>
                    <tr>
                        <th
                            className={headerClass}
                            onClick={() => handleSort('email')}
                        >
                            <span className='inline-flex items-center'>
                                Email {getSortIcon('email')}
                            </span>
                        </th>
                        <th
                            className={headerClass}
                            onClick={() => handleSort('status')}
                        >
                            <span className='inline-flex items-center'>
                                Status {getSortIcon('status')}
                            </span>
                        </th>
                        <th
                            className={headerClass}
                            onClick={() => handleSort('openedAt')}
                        >
                            <span className='inline-flex items-center'>
                                Opened {getSortIcon('openedAt')}
                            </span>
                        </th>
                        <th
                            className={headerClass}
                            onClick={() => handleSort('clicks')}
                        >
                            <span className='inline-flex items-center'>
                                Clicks {getSortIcon('clicks')}
                            </span>
                        </th>
                        <th
                            className={headerClass}
                            onClick={() => handleSort('unsubscribedAt')}
                        >
                            <span className='inline-flex items-center'>
                                Unsubscribed {getSortIcon('unsubscribedAt')}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody className='divide-y'>
                    {sortedEmails.map((email) => (
                        <tr key={email.id} className='hover:bg-gray-50'>
                            <td className='p-4'>
                                <div>
                                    <p className='font-medium'>
                                        {email.contactEmail}
                                    </p>
                                    <p className='text-sm text-gray-500'>
                                        {email.contactName}
                                    </p>
                                </div>
                            </td>
                            <td className='p-4'>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                        email.status === 'CLICKED'
                                            ? 'bg-purple-100 text-purple-700'
                                            : email.status === 'OPENED'
                                              ? 'bg-green-100 text-green-700'
                                              : email.status === 'UNSUBSCRIBED'
                                                ? 'bg-red-100 text-red-700'
                                                : email.status === 'SENT'
                                                  ? 'bg-blue-100 text-blue-700'
                                                  : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {email.status}
                                </span>
                            </td>
                            <td className='p-4 text-sm'>
                                {formatDate(email.openedAt)}
                            </td>
                            <td className='p-4 text-sm'>
                                {email.clickCount > 0 ? (
                                    <span className='font-medium'>
                                        {email.clickCount} clicks
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </td>
                            <td className='p-4 text-sm'>
                                {formatDate(email.unsubscribedAt)}
                            </td>
                        </tr>
                    ))}
                    {sortedEmails.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className='p-8 text-center text-gray-500'
                            >
                                No emails sent yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
