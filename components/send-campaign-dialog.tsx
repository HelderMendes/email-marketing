'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
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
    Users,
    Clock,
    Calendar,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const AMSTERDAM_TZ = 'Europe/Amsterdam';

/**
 * 📝 Teaching note: Discriminated union for state management.
 * Instead of multiple boolean flags (isLoading, isError, isSuccess),
 * we use a single `_tag` field. This makes impossible states impossible.
 *
 * For example, you can't have isLoading=true AND isSuccess=true simultaneously.
 */
type SendMode = 'now' | 'scheduled';

type SendState =
    | { _tag: 'idle' }
    | { _tag: 'confirming' }
    | { _tag: 'starting' }
    | { _tag: 'scheduling' }
    | { _tag: 'scheduled'; scheduledAt: Date }
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

type ContactGroup = {
    id: number;
    name: string;
    color: string | null;
    _count: { contacts: number };
};

type SendCampaignDialogProps = {
    campaignId: number;
    campaignName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: () => void;
    groups?: ContactGroup[];
};

export function SendCampaignDialog({
    campaignId,
    campaignName,
    open,
    onOpenChange,
    onComplete,
    groups = [],
}: SendCampaignDialogProps) {
    const [state, setState] = useState<SendState>({ _tag: 'idle' });
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [sendMode, setSendMode] = useState<SendMode>('now');
    const [scheduledDate, setScheduledDate] = useState<string>('');
    const [scheduledTime, setScheduledTime] = useState<string>('');

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setState({ _tag: 'confirming' });
            setSelectedGroups([]);
            setSendMode('now');
            // Default to tomorrow at 10:00 Amsterdam time
            const now = new Date();
            const amsterdamNow = toZonedTime(now, AMSTERDAM_TZ);
            const tomorrow = addMinutes(amsterdamNow, 24 * 60);
            const defaultDate = setHours(setMinutes(tomorrow, 0), 10);
            setScheduledDate(format(defaultDate, 'yyyy-MM-dd'));
            setScheduledTime('10:00');
        } else {
            setState({ _tag: 'idle' });
        }
    }, [open]);

    const toggleGroup = (groupId: number) => {
        setSelectedGroups((prev) =>
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId],
        );
    };

    const totalSelectedContacts =
        selectedGroups.length === 0
            ? 'all contacts'
            : groups
                  .filter((g) => selectedGroups.includes(g.id))
                  .reduce((sum, g) => sum + g._count.contacts, 0) +
              ' contacts (may include duplicates)';

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

    const getScheduledDateTime = (): Date | null => {
        if (!scheduledDate || !scheduledTime) return null;
        // Parse as Amsterdam time, then convert to UTC
        const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
        return fromZonedTime(localDateTime, AMSTERDAM_TZ);
    };

    const scheduleCampaign = async () => {
        const scheduledAt = getScheduledDateTime();
        if (!scheduledAt) {
            setState({
                _tag: 'error',
                message: 'Please select a valid date and time',
            });
            return;
        }

        // Check if scheduled time is in the future
        if (scheduledAt <= new Date()) {
            setState({
                _tag: 'error',
                message: 'Scheduled time must be in the future',
            });
            return;
        }

        setState({ _tag: 'scheduling' });

        try {
            const res = await fetch(`/api/campaigns/${campaignId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupIds: selectedGroups.length > 0 ? selectedGroups : null,
                    scheduledAt: scheduledAt.toISOString(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to schedule campaign');
            }

            setState({ _tag: 'scheduled', scheduledAt });
            onComplete?.();
        } catch (error) {
            setState({
                _tag: 'error',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const startSending = async () => {
        if (sendMode === 'scheduled') {
            await scheduleCampaign();
            return;
        }

        setState({ _tag: 'starting' });

        try {
            // Step 1: Create the send job
            const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupIds: selectedGroups.length > 0 ? selectedGroups : null,
                }),
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
        state._tag === 'scheduled' ||
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
                            {/* Group Selection */}
                            {groups.length > 0 && (
                                <div className='space-y-3'>
                                    <div className='flex items-center gap-2'>
                                        <Users className='h-4 w-4 text-muted-foreground' />
                                        <Label className='text-sm font-medium'>
                                            Select target groups
                                        </Label>
                                    </div>
                                    <div className='space-y-2 max-h-[200px] overflow-y-auto rounded-md border p-3'>
                                        {groups.map((group) => (
                                            <div
                                                key={group.id}
                                                className='flex items-center gap-2'
                                            >
                                                <Checkbox
                                                    id={`group-${group.id}`}
                                                    checked={selectedGroups.includes(
                                                        group.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleGroup(group.id)
                                                    }
                                                />
                                                <label
                                                    htmlFor={`group-${group.id}`}
                                                    className='flex items-center gap-2 text-sm cursor-pointer flex-1'
                                                >
                                                    <span
                                                        className='w-2 h-2 rounded-full'
                                                        style={{
                                                            backgroundColor:
                                                                group.color ||
                                                                '#6366f1',
                                                        }}
                                                    />
                                                    {group.name}
                                                    <span className='text-muted-foreground'>
                                                        ({group._count.contacts}
                                                        )
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        {selectedGroups.length === 0
                                            ? 'No groups selected — will send to ALL subscribed contacts'
                                            : `Targeting ${totalSelectedContacts}`}
                                    </p>
                                </div>
                            )}

                            {/* Send Mode Toggle */}
                            <div className='space-y-3'>
                                <Label className='text-sm font-medium'>
                                    When to send
                                </Label>
                                <div className='flex gap-2'>
                                    <Button
                                        type='button'
                                        variant={
                                            sendMode === 'now'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() => setSendMode('now')}
                                        className='flex-1'
                                    >
                                        <Mail className='mr-2 h-4 w-4' />
                                        Send Now
                                    </Button>
                                    <Button
                                        type='button'
                                        variant={
                                            sendMode === 'scheduled'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() => setSendMode('scheduled')}
                                        className='flex-1'
                                    >
                                        <Clock className='mr-2 h-4 w-4' />
                                        Schedule
                                    </Button>
                                </div>
                            </div>

                            {/* Schedule Date/Time Picker */}
                            {sendMode === 'scheduled' && (
                                <div className='space-y-3 rounded-lg border p-3 bg-muted/50'>
                                    <div className='flex items-center gap-2'>
                                        <Calendar className='h-4 w-4 text-muted-foreground' />
                                        <Label className='text-sm font-medium'>
                                            Schedule for (Amsterdam time)
                                        </Label>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Input
                                            type='date'
                                            value={scheduledDate}
                                            onChange={(e) =>
                                                setScheduledDate(e.target.value)
                                            }
                                            min={format(
                                                new Date(),
                                                'yyyy-MM-dd',
                                            )}
                                            className='flex-1'
                                        />
                                        <Input
                                            type='time'
                                            value={scheduledTime}
                                            onChange={(e) =>
                                                setScheduledTime(e.target.value)
                                            }
                                            className='w-32'
                                        />
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        Central European Time (CET/CEST)
                                    </p>
                                </div>
                            )}

                            <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950'>
                                <AlertTriangle className='h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5' />
                                <div className='text-sm'>
                                    <p className='font-medium text-amber-800 dark:text-amber-200'>
                                        {sendMode === 'now'
                                            ? 'Ready to send?'
                                            : 'Ready to schedule?'}
                                    </p>
                                    <p className='text-amber-700 dark:text-amber-300 mt-1'>
                                        {selectedGroups.length === 0
                                            ? 'This will send the campaign to all subscribed contacts.'
                                            : `This will send to contacts in the selected group${selectedGroups.length > 1 ? 's' : ''}.`}{' '}
                                        {sendMode === 'now'
                                            ? 'This action cannot be undone.'
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Starting State */}
                    {(state._tag === 'starting' ||
                        state._tag === 'scheduling') && (
                        <div className='flex flex-col items-center gap-4 py-6'>
                            <Loader2 className='h-8 w-8 animate-spin text-primary' />
                            <p className='text-sm text-muted-foreground'>
                                {state._tag === 'scheduling'
                                    ? 'Scheduling campaign...'
                                    : 'Preparing to send...'}
                            </p>
                        </div>
                    )}

                    {/* Scheduled State */}
                    {state._tag === 'scheduled' && (
                        <div className='flex flex-col items-center gap-4 py-4'>
                            <div className='rounded-full bg-blue-100 p-3 dark:bg-blue-900'>
                                <Clock className='h-8 w-8 text-blue-600 dark:text-blue-400' />
                            </div>
                            <div className='text-center'>
                                <p className='font-medium'>
                                    Campaign scheduled!
                                </p>
                                <p className='text-sm text-muted-foreground mt-1'>
                                    Will be sent on{' '}
                                    {format(
                                        toZonedTime(
                                            state.scheduledAt,
                                            AMSTERDAM_TZ,
                                        ),
                                        'PPP',
                                    )}{' '}
                                    at{' '}
                                    {format(
                                        toZonedTime(
                                            state.scheduledAt,
                                            AMSTERDAM_TZ,
                                        ),
                                        'HH:mm',
                                    )}{' '}
                                    (Amsterdam)
                                </p>
                                <p className='text-sm text-muted-foreground mt-2'>
                                    <span className='font-medium'>To: </span>
                                    {selectedGroups.length === 0
                                        ? 'All contacts'
                                        : groups
                                              .filter((g) =>
                                                  selectedGroups.includes(g.id),
                                              )
                                              .map((g) => g.name)
                                              .join(', ')}
                                </p>
                            </div>
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
                                {sendMode === 'now' ? (
                                    <>
                                        <Mail className='mr-2 h-4 w-4' />
                                        Send Now
                                    </>
                                ) : (
                                    <>
                                        <Clock className='mr-2 h-4 w-4' />
                                        Schedule
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {(state._tag === 'completed' ||
                        state._tag === 'scheduled' ||
                        state._tag === 'error') && (
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
