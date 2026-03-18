export type SerializedCampaign = {
    id: number;
    name: string;
    status: string;
    sentAt: string | null;
    scheduledAt: string | null;
    createdAt: string;
};
