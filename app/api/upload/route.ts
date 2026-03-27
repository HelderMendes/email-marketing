import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!request.body || !filename) {
        return NextResponse.json(
            { error: 'File and filename are required' },
            { status: 400 },
        );
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
            addRandomSuffix: true,
        });

        // Save to database for Media Library
        try {
            console.log('Attempting to save to database...');
            const mediaFile = await prisma.mediaFile.create({
                data: {
                    filename: filename,
                    url: blob.url,
                    mimeType: blob.contentType || 'image/jpeg',
                    size: 0,
                },
            });
            console.log('Saved to database:', mediaFile.id);
            return NextResponse.json({ ...blob, mediaFileId: mediaFile.id });
        } catch (dbError) {
            console.error('Database save error:', dbError);
            // Return error details in response for debugging
            return NextResponse.json({
                ...blob,
                dbError:
                    dbError instanceof Error
                        ? dbError.message
                        : 'Unknown DB error',
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 },
        );
    }
}

export async function GET(): Promise<NextResponse> {
    try {
        const mediaFiles = await prisma.mediaFile.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return NextResponse.json(mediaFiles);
    } catch {
        return NextResponse.json([]);
    }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const url = searchParams.get('url');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        // Delete from database
        await prisma.mediaFile.delete({
            where: { id: parseInt(id) },
        });

        // Delete from blob storage if URL provided
        if (url) {
            try {
                await del(url);
            } catch (blobError) {
                console.error('Blob delete error:', blobError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 },
        );
    }
}
