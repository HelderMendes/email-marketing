import { Contact } from '@prisma/client';

export type SerializedContact = Omit<
    Contact,
    'createdAt' | 'updatedAt' | 'consentDate'
> & {
    createdAt: string;
    updatedAt: string;
    consentDate: string | null;
};
