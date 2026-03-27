'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Mail,
    AlertTriangle,
} from 'lucide-react';

/**
 * 📝 Teaching note: Discriminated union for state management.
 * Instead of multiple boolean flags (isLoading, isError, isSuccess),
 * we use a single `_tag` field. This makes impossible states impossible.
 *
 * For example, you can't have isLoading=true AND isSuccess=true simultaneously.
 */
type SendState =
    | { _tag: 'idle' }
    | { _tag: 'confirming' }
    | { _tag: 'starting' }
    | {
          _tag: 'sending';
          sentCount: number;
          totalCount: number;
          failedCount: number;
      }
    | {
          _tag: 'completed';
          sentCount: number;
          totalCount: number;
          failedCount: number;
      }
    | { _tag: 'error'; message: string };

type SendCampaignDialogProps = {
    campaignId: number;
    campaignName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: () => void;
};

export function SendCampaignDialog({
    campaignId,
    campaignName,
    open,
    onOpenChange,
    onComplete,
}: SendCampaignDialogProps) {
    const [state, setState] = useState<SendState>({ _tag: 'idle' });

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setState({ _tag: 'confirming' });
        } else {
            setState({ _tag: 'idle' });
        }
    }, [open]);

    const processBatch = useCallback(async (): Promise<boolean> => {
        const res = await fetch(`/api/campaigns/${campaignId}/send/batch`, {
            method: 'POST',
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to process batch');
        }

        const data = await res.json();

        setState({
            _tag: data.status === 'COMPLETED' ? 'completed' : 'sending',
            sentCount: data.sentCount,
            totalCount: data.totalCount,
            failedCount: data.failedCount,
        });

        return data.status === 'COMPLETED';
    }, [campaignId]);

    const startSending = async () => {
        setState({ _tag: 'starting' });

        try {
            // Step 1: Create the send job
            const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to start send job');
            }

            const jobData = await res.json();

            setState({
                _tag: 'sending',
                sentCount: 0,
                totalCount: jobData.totalCount,
                failedCount: 0,
            });

            // Step 2: Process batches until complete
            let isComplete = false;
            while (!isComplete) {
                isComplete = await processBatch();

                // Small delay between batches to avoid overwhelming the server
                if (!isComplete) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            onComplete?.();
        } catch (error) {
            setState({
                _tag: 'error',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const progress =
        state._tag === 'sending' || state._tag === 'completed'
            ? Math.round((state.sentCount / state.totalCount) * 100)
            : 0;

    const canClose =
        state._tag === 'confirming' ||
        state._tag === 'completed' ||
        state._tag === 'error';

    return (
        <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Mail className='h-5 w-5' />
                        Send Campaign
                    </DialogTitle>
                    <DialogDescription>{campaignName}</DialogDescription>
                </DialogHeader>

                <div className='py-4'>
                    {/* Confirming State */}
                    {state._tag === 'confirming' && (
                        <div className='space-y-4'>
                            <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950'>
                                <AlertTriangle className='h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5' />
                                <div className='text-sm'>
                                    <p className='font-medium text-amber-800 dark:text-amber-200'>
                                        Ready to send?
                                    </p>
                                    <p className='text-amber-700 dark:text-amber-300 mt-1'>
                                        This will send the campaign to all
                                        subscribed contacts. This action cannot
                                        be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Starting State */}
                    {state._tag === 'starting' && (
                        <div className='flex flex-col items-center gap-4 py-6'>
                            <Loader2 className='h-8 w-8 animate-spin text-primary' />
                            <p className='text-sm text-muted-foreground'>
                                Preparing to send...
                            </p>
                        </div>
                    )}

                    {/* Sending State */}
                    {state._tag === 'sending' && (
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span>Sending emails...</span>
                                    <span className='font-medium'>
                                        {state.sentCount} / {state.totalCount}
                                    </span>
                                </div>
                                <Progress value={progress} className='h-3' />
                                <p className='text-xs text-muted-foreground text-center'>
                                    {progress}% complete
                                    {state.failedCount > 0 && (
                                        <span className='text-destructive ml-2'>
                                            ({state.failedCount} failed)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <p className='text-xs text-center text-muted-foreground'>
                                Please keep this window open until sending is
                                complete.
                            </p>
                        </div>
                    )}

                    {/* Completed State */}
                    {state._tag === 'completed' && (
                        <div className='flex flex-col items-center gap-4 py-4'>
                            <div className='rounded-full bg-green-100 p-3 dark:bg-green-900'>
                                <CheckCircle2 className='h-8 w-8 text-green-600 dark:text-green-400' />
                            </div>
                            <div className='text-center'>
                                <p className='font-medium'>
                                    Campaign sent successfully!
                                </p>
                                <p className='text-sm text-muted-foreground mt-1'>
                                    {state.sentCount} emails sent
                                    {state.failedCount > 0 && (
                                        <span className='text-destructive'>
                                            , {state.failedCount} failed
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {state._tag === 'error' && (
                        <div className='flex flex-col items-center gap-4 py-4'>
                            <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                                <XCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
                            </div>
                            <div className='text-center'>
                                <p className='font-medium text-destructive'>
                                    Failed to send
                                </p>
                                <p className='text-sm text-muted-foreground mt-1'>
                                    {state.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {state._tag === 'confirming' && (
                        <>
                            <Button
                                variant='outline'
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={startSending}>
                                <Mail className='mr-2 h-4 w-4' />
                                Send Now
                            </Button>
                        </>
                    )}

                    {(state._tag === 'completed' || state._tag === 'error') && (
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
