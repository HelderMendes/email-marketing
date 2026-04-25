import { prisma } from '@/lib/prisma';
import { SerializedContact } from './types';
import { ContactsClient } from './contacts-client';
import { PaginationControls } from '@/components/pagination-controls';

const DEFAULT_PAGE_SIZE = 10;

type ContactGroup = {
    id: number;
    name: string;
    color: string | null;
};

async function getContacts(
    page: number,
    pageSize: number,
    sortField: string,
    sortOrder: 'asc' | 'desc',
    search?: string,
    groupId?: number,
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

    // Build where clause for search and group filter
    const where: {
        OR?: Array<{
            email?: { contains: string; mode: 'insensitive' };
            firstName?: { contains: string; mode: 'insensitive' };
            lastName?: { contains: string; mode: 'insensitive' };
        }>;
        groups?: { some: { id: number } };
    } = {};

    if (search && search.trim()) {
        where.OR = [
            { email: { contains: search.trim(), mode: 'insensitive' } },
            { firstName: { contains: search.trim(), mode: 'insensitive' } },
            { lastName: { contains: search.trim(), mode: 'insensitive' } },
        ];
    }

    if (groupId) {
        where.groups = { some: { id: groupId } };
    }

    const [contacts, totalCount] = await Promise.all([
        prisma.contact.findMany({
            where,
            include: {
                groups: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy,
            skip,
            take: pageSize,
        }),
        prisma.contact.count({ where }),
    ]);

    const serializedData = contacts.map((contact) => ({
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        consentDate: contact.consentDate
            ? contact.consentDate.toISOString()
            : null,
        groups: contact.groups as ContactGroup[],
    })) as SerializedContact[];

    return { data: serializedData, totalCount };
}

async function getGroups() {
    return prisma.contactGroup.findMany({
        include: {
            _count: { select: { contacts: true } },
        },
        orderBy: { name: 'asc' },
    });
}

export default async function ContactsPage({
    searchParams,
}: {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        sort?: string;
        order?: string;
        search?: string;
        groupId?: string;
    }>;
}) {
    const params = await searchParams;
    let page = parseInt(params.page || '1');
    if (isNaN(page) || page < 1) page = 1;

    let pageSize = parseInt(params.pageSize || String(DEFAULT_PAGE_SIZE));
    if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;

    const sort = params.sort || 'createdAt';
    const order = (params.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const search = params.search || '';
    const groupId = params.groupId ? parseInt(params.groupId) : undefined;

    const [{ data, totalCount }, groups] = await Promise.all([
        getContacts(page, pageSize, sort, order, search, groupId),
        getGroups(),
    ]);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Build base URL with current params except page
    const queryParams = new URLSearchParams();
    if (pageSize !== DEFAULT_PAGE_SIZE)
        queryParams.set('pageSize', pageSize.toString());
    if (sort !== 'createdAt') queryParams.set('sort', sort);
    if (order !== 'desc') queryParams.set('order', order);
    if (search) queryParams.set('search', search);
    if (groupId) queryParams.set('groupId', groupId.toString());

    const baseUrl = `/admin/contacts?${queryParams.toString()}`;

    // Serialize groups for client
    const serializedGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        _count: g._count,
    }));

    return (
        <div className='container mx-auto py-10'>
            <ContactsClient
                data={data}
                pageSize={pageSize}
                sort={sort}
                order={order}
                search={search}
                groupId={groupId}
                groups={serializedGroups}
                totalCount={totalCount}
            />
            <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                baseUrl={baseUrl}
            />
        </div>
    );
}
