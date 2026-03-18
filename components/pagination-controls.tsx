import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export function PaginationControls({
    currentPage,
    totalPages,
    baseUrl,
}: PaginationControlsProps) {
    const createPageURL = (pageNumber: number | string) => {
        // Check if baseUrl already has params
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}page=${pageNumber}`;
    };

    if (totalPages <= 1) return null;

    return (
        <Pagination className='my-8'>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href={
                            currentPage > 1
                                ? createPageURL(currentPage - 1)
                                : '#'
                        }
                        aria-disabled={currentPage <= 1}
                        className={
                            currentPage <= 1
                                ? 'pointer-events-none opacity-50'
                                : ''
                        }
                    />
                </PaginationItem>

                {/* Helper function to generate paginaton items */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                        // Logic for ellipsis: show first, last, current, and neighbors
                        const isFirst = page === 1;
                        const isLast = page === totalPages;
                        const isCurrent = page === currentPage;
                        const isNearCurrent = Math.abs(page - currentPage) <= 1;

                        if (isFirst || isLast || isCurrent || isNearCurrent) {
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href={createPageURL(page)}
                                        isActive={isCurrent}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        }

                        // Show ellipsis if gap exists
                        if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                        ) {
                            return (
                                <PaginationItem key={page}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            );
                        }

                        return null;
                    },
                )}

                <PaginationItem>
                    <PaginationNext
                        href={
                            currentPage < totalPages
                                ? createPageURL(currentPage + 1)
                                : '#'
                        }
                        aria-disabled={currentPage >= totalPages}
                        className={
                            currentPage >= totalPages
                                ? 'pointer-events-none opacity-50'
                                : ''
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
