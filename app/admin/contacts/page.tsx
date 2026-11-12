import { Prisma } from '@prisma/client';
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

const CLICK_SORT_FIELDS = ['lastClickedCampaign', 'totalClicks'];

const contactInclude = {
    groups: {
        select: { id: true, name: true, color: true },
    },
} satisfies Prisma.ContactInclude;

type ClickStats = {
    lastClickedCampaign: string | null;
    lastClickedAt: number;
    totalClicks: number;
};

async function getClickStats(
    contactWhere: Prisma.ContactWhereInput,
): Promise<Map<number, ClickStats>> {
    const emails = await prisma.campaignEmail.findMany({
        where: { clickCount: { gt: 0 }, contact: contactWhere },
        select: {
            contactId: true,
            clickCount: true,
            clickedAt: true,
            campaign: { select: { name: true } },
            clicks: {
                select: { clickedAt: true },
                orderBy: { clickedAt: 'desc' },
                take: 1,
            },
        },
    });

    const stats = new Map<number, ClickStats>();
    for (const email of emails) {
        const clickedAt =
            (email.clicks[0]?.clickedAt ?? email.clickedAt)?.getTime() ?? 0;
        const current = stats.get(email.contactId) ?? {
            lastClickedCampaign: null,
            lastClickedAt: -1,
            totalClicks: 0,
        };
        current.totalClicks += email.clickCount;
        if (clickedAt > current.lastClickedAt) {
            current.lastClickedAt = clickedAt;
            current.lastClickedCampaign = email.campaign.name;
        }
        stats.set(email.contactId, current);
    }
    return stats;
}

function compareClickStats(
    a: ClickStats | undefined,
    b: ClickStats | undefined,
    sortField: string,
    sortOrder: 'asc' | 'desc',
): number {
    const direction = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'totalClicks') {
        return ((a?.totalClicks ?? 0) - (b?.totalClicks ?? 0)) * direction;
    }
    const nameA = a?.lastClickedCampaign;
    const nameB = b?.lastClickedCampaign;
    // Contacts without clicks always go last
    if (!nameA || !nameB) return nameA ? -1 : nameB ? 1 : 0;
    return nameA.localeCompare(nameB, 'nl', { numeric: true }) * direction;
}

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

    let contacts: Prisma.ContactGetPayload<{
        include: typeof contactInclude;
    }>[];
    let totalCount: number;
    let clickStats: Map<number, ClickStats>;

    if (CLICK_SORT_FIELDS.includes(sortField)) {
        // Click stats are computed, so sort all matching ids in memory
        const [allContacts, stats] = await Promise.all([
            prisma.contact.findMany({
                where,
                select: { id: true },
                orderBy: { createdAt: 'desc' },
            }),
            getClickStats(where),
        ]);
        const pageIds = allContacts
            .map((c) => c.id)
            .sort((a, b) =>
                compareClickStats(
                    stats.get(a),
                    stats.get(b),
                    sortField,
                    sortOrder,
                ),
            )
            .slice(skip, skip + pageSize);
        const pageContacts = await prisma.contact.findMany({
            where: { id: { in: pageIds } },
            include: contactInclude,
        });
        contacts = pageIds.flatMap((id) =>
            pageContacts.filter((c) => c.id === id),
        );
        totalCount = allContacts.length;
        clickStats = stats;
    } else {
        [contacts, totalCount] = await Promise.all([
            prisma.contact.findMany({
                where,
                include: contactInclude,
                orderBy,
                skip,
                take: pageSize,
            }),
            prisma.contact.count({ where }),
        ]);
        clickStats = await getClickStats({
            id: { in: contacts.map((c) => c.id) },
        });
    }

    const serializedData = contacts.map((contact) => ({
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        consentDate: contact.consentDate
            ? contact.consentDate.toISOString()
            : null,
        groups: contact.groups as ContactGroup[],
        lastClickedCampaign:
            clickStats.get(contact.id)?.lastClickedCampaign ?? null,
        totalClicks: clickStats.get(contact.id)?.totalClicks ?? 0,
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
