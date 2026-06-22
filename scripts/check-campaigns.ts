import { prisma } from '../lib/prisma';

async function main() {
    const campaigns = await prisma.campaign.findMany({
        select: { id: true, name: true, status: true, sentAt: true },
        orderBy: { id: 'desc' },
    });
    console.log('All campaigns:');
    console.table(campaigns);

    // Check for campaigns with emails sent but wrong status
    const campaignsWithEmails = await prisma.campaign.findMany({
        where: { status: { not: 'SENT' } },
        include: { emails: { take: 1 } },
    });

    for (const c of campaignsWithEmails) {
        if (c.emails.length > 0) {
            console.log(
                `\nCampaign ${c.id} "${c.name}" has emails but status is ${c.status}`,
            );
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
