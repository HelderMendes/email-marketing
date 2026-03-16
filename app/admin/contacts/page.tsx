import { prisma } from '@/lib/prisma';
import { columns, SerializedContact } from './columns';
import { DataTable } from '@/components/ui/data-table';

async function getContacts(): Promise<SerializedContact[]> {
    const data = await prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return data.map((contact) => ({
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
    })) as SerializedContact[];
}

export default async function ContactsPage() {
    const data = await getContacts();

    return (
        <div className='container mx-auto py-10'>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-bold'>Contacts Administration</h1>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
}
