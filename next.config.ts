import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    turbopack: {
        root: path.resolve(__dirname), // Fix lockfile detection warning
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
};

export default nextConfig;
