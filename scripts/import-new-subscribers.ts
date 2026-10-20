import { prisma } from '../lib/prisma';

const contactsData = [
    { email: 'diana.kuzyk@web.de', firstName: 'Diana', lastName: 'Kuzyk' },
    { email: 'ettienijlunsing@gmail.com', firstName: '', lastName: '' },
    { email: 'hilda.allaert@klm.com', firstName: '', lastName: '' },
    { email: 'mariskaboekel@gmail.com', firstName: '', lastName: '' },
    { email: 'sietskepadding@gmail.com', firstName: '', lastName: '' },
    { email: 'annettebrederode@kpnplanet.nl', firstName: '', lastName: '' },
    { email: 'hester.sijtsma@gmail.com', firstName: '', lastName: '' },
    { email: 'linda.de.beer@outlook.com', firstName: '', lastName: '' },
    { email: 'annekebeukman@gmail.com', firstName: '', lastName: '' },
    { email: 'vriesman.bergsma@planet.nl', firstName: '', lastName: '' },
    { email: 'ineke.koksma@gmail.com', firstName: '', lastName: '' },
    { email: 'marthydt@me.com', firstName: '', lastName: '' },
    { email: 'patoudijsselhof@gmail.com', firstName: '', lastName: '' },
    { email: 'esterellevanzanten@gmail.com', firstName: '', lastName: '' },
    { email: 'mvanhaaften62@hotmail.com', firstName: '', lastName: '' },
    { email: 'info@alettarenken.nl', firstName: '', lastName: '' },
    { email: 'machteldsoeters@gmail.com', firstName: '', lastName: '' },
    { email: 'gademan@xs4all.nl', firstName: 'Fieneke', lastName: 'Gademan' },
];

async function main() {
    const groupName = 'New Subscriptions - Sept 2026';

    // 1. Create or fetch group
    const group = await prisma.contactGroup.upsert({
        where: { name: groupName },
        update: {},
        create: {
            name: groupName,
            description: 'New subscribers batch imported on Sept 8, 2026',
            color: '#10b981', // Emerald green token
        },
    });

    console.log(
        `[GROUP] Target group standard created/verified: "${group.name}" (ID: ${group.id})`,
    );

    // 2. Batch upsert contacts and associate with group
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of contactsData) {
        const cleanEmail = item.email.trim().toLowerCase();
        const firstName = item.firstName.trim() || null;
        const lastName = item.lastName.trim() || null;

        const existing = await prisma.contact.findUnique({
            where: { email: cleanEmail },
        });

        if (existing) {
            await prisma.contact.update({
                where: { id: existing.id },
                data: {
                    status: 'SUBSCRIBED',
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                    groups: {
                        connect: { id: group.id },
                    },
                },
            });
            updatedCount++;
        } else {
            await prisma.contact.create({
                data: {
                    email: cleanEmail,
                    firstName,
                    lastName,
                    status: 'SUBSCRIBED',
                    source: 'MANUAL',
                    consentGiven: true,
                    consentDate: new Date(),
                    groups: {
                        connect: { id: group.id },
                    },
                },
            });
            createdCount++;
        }
    }

    console.log(
        `[UPSERT COMPLETE] Created: ${createdCount}, Updated: ${updatedCount}, Total: ${contactsData.length}`,
    );

    // Verify contacts in group
    const groupWithContacts = await prisma.contactGroup.findUnique({
        where: { id: group.id },
        include: {
            contacts: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                },
            },
        },
    });

    console.log(
        `[VERIFICATION] Total contacts linked to "${groupName}": ${groupWithContacts?.contacts.length}`,
    );
}

main()
    .catch((err) => {
        console.error('Execution failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
