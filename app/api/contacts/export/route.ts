import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Convert to CSV
        const headers = [
            'Email',
            'FirstName',
            'LastName',
            'Status',
            'Source',
            'CreatedAt',
        ];
        const csvRows = [headers.join(',')];

        for (const contact of contacts) {
            const row = [
                contact.email,
                contact.firstName || '',
                contact.lastName || '',
                contact.status,
                contact.source,
                contact.createdAt.toISOString(),
            ];
            // Simple escaping
            const escapedRow = row.map((field) => `"${field}"`).join(',');
            csvRows.push(escapedRow);
        }

        const csvString = csvRows.join('\n');

        return new NextResponse(csvString, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition':
                    'attachment; filename="contacts_export.csv"',
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export contacts' },
            { status: 500 },
        );
    }
}
