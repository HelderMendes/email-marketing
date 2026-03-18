import { prisma } from '@/lib/prisma';
import { SerializedContact } from './types';
import { ContactsClient } from './contacts-client';
import { PaginationControls } from '@/components/pagination-controls';

const DEFAULT_PAGE_SIZE = 10;

async function getContacts(
    page: number,
    pageSize: number,
    sortField: string,
    sortOrder: 'asc' | 'desc',
): Promise<{ data: SerializedContact[]; totalCount: number }> {
    const skip = (page - 1) * pageSize;

    // Map frontend sort keys to database fields
    const validSortFields = [
        'email',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
        'status',
        'source',
    ];
    const orderBy = validSortFields.includes(sortField)
        ? { [sortField]: sortOrder }
        : { createdAt: 'desc' as const };

    const [contacts, totalCount] = await Promise.all([
        prisma.contact.findMany({
            orderBy,
            skip,
            take: pageSize,
        }),
        prisma.contact.count(),
    ]);

    const serializedData = contacts.map((contact) => ({
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        consentDate: contact.consentDate
            ? contact.consentDate.toISOString()
            : null,
    })) as SerializedContact[];

    return { data: serializedData, totalCount };
}

export default async function ContactsPage({
    searchParams,
}: {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        sort?: string;
        order?: string;
    }>;
}) {
    const params = await searchParams;
    let page = parseInt(params.page || '1');
    if (isNaN(page) || page < 1) page = 1;

    let pageSize = parseInt(params.pageSize || String(DEFAULT_PAGE_SIZE));
    if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;

    const sort = params.sort || 'createdAt';
    const order = (params.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const { data, totalCount } = await getContacts(page, pageSize, sort, order);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Build base URL with current params except page
    const queryParams = new URLSearchParams();
    if (pageSize !== DEFAULT_PAGE_SIZE)
        queryParams.set('pageSize', pageSize.toString());
    if (sort !== 'createdAt') queryParams.set('sort', sort);
    if (order !== 'desc') queryParams.set('order', order);

    // Construct baseUrl for pagination
    // Ideally this should preserve existing query params, handled by client or here
    // But since pagination controls just append ?page=X, we put base params in baseUrl
    const baseUrl = `/admin/contacts?${queryParams.toString()}`;

    // Pass sorting state to client so it can highlight correct column
    // and pageSize
    return (
        <div className='container mx-auto py-10'>
            <ContactsClient
                data={data}
                pageSize={pageSize}
                sort={sort}
                order={order}
            />
            <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                baseUrl={baseUrl}
            />
        </div>
    );
}
