import { Contact } from '@prisma/client';

export type ContactGroup = {
    id: number;
    name: string;
    color: string | null;
};

export type SerializedContact = Omit<
    Contact,
    'createdAt' | 'updatedAt' | 'consentDate'
> & {
    createdAt: string;
    updatedAt: string;
    consentDate: string | null;
    groups?: ContactGroup[];
};
