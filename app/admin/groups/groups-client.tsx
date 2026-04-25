'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

type SerializedGroup = {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { contacts: number };
};

interface GroupsClientProps {
    groups: SerializedGroup[];
}

const COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#6b7280', // Gray
];

export function GroupsClient({ groups }: GroupsClientProps) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<SerializedGroup | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to create group');
                return;
            }

            setIsCreateOpen(false);
            router.refresh();
        } catch {
            alert('Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGroup) return;
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;

        try {
            const res = await fetch(`/api/groups/${editingGroup.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to update group');
                return;
            }

            setEditingGroup(null);
            router.refresh();
        } catch {
            alert('Failed to update group');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (group: SerializedGroup) => {
        if (
            !confirm(
                `Delete group "${group.name}"? Contacts will NOT be deleted.`,
            )
        ) {
            return;
        }

        try {
            const res = await fetch(`/api/groups/${group.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                alert('Failed to delete group');
                return;
            }

            router.refresh();
        } catch {
            alert('Failed to delete group');
        }
    };

    return (
        <div>
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-2xl font-bold'>Contact Groups</h1>
                    <p className='text-muted-foreground'>
                        Organize your contacts into groups for targeted
                        campaigns
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className='mr-2 h-4 w-4' /> Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Group</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className='space-y-4'>
                            <div>
                                <Label htmlFor='name'>Group Name</Label>
                                <Input
                                    id='name'
                                    name='name'
                                    required
                                    placeholder='e.g., Test Group, VIP Customers'
                                />
                            </div>
                            <div>
                                <Label htmlFor='description'>
                                    Description (optional)
                                </Label>
                                <Input
                                    id='description'
                                    name='description'
                                    placeholder='Brief description of this group'
                                />
                            </div>
                            <div>
                                <Label>Color</Label>
                                <div className='flex gap-2 mt-2'>
                                    {COLORS.map((color) => (
                                        <label
                                            key={color}
                                            className='cursor-pointer'
                                        >
                                            <input
                                                type='radio'
                                                name='color'
                                                value={color}
                                                defaultChecked={
                                                    color === COLORS[0]
                                                }
                                                className='sr-only peer'
                                            />
                                            <div
                                                className='w-6 h-6 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-gray-400 transition-all'
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className='flex justify-end gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type='submit' disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Group'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {groups.length === 0 ? (
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-12'>
                        <Users className='h-12 w-12 text-muted-foreground mb-4' />
                        <p className='text-lg font-medium'>No groups yet</p>
                        <p className='text-muted-foreground mb-4'>
                            Create your first group to organize contacts
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className='mr-2 h-4 w-4' /> Create Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {groups.map((group) => (
                        <Card key={group.id} className='relative'>
                            <div
                                className='absolute top-0 left-0 right-0 h-1 rounded-t-lg'
                                style={{
                                    backgroundColor: group.color || '#6366f1',
                                }}
                            />
                            <CardHeader className='pb-2'>
                                <div className='flex justify-between items-start'>
                                    <div>
                                        <CardTitle className='text-lg'>
                                            {group.name}
                                        </CardTitle>
                                        {group.description && (
                                            <CardDescription>
                                                {group.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <div className='flex gap-1'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8'
                                            onClick={() =>
                                                setEditingGroup(group)
                                            }
                                        >
                                            <Pencil className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 text-destructive hover:text-destructive'
                                            onClick={() => handleDelete(group)}
                                        >
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className='flex items-center text-sm text-muted-foreground'>
                                    <Users className='h-4 w-4 mr-1' />
                                    {group._count.contacts} contact
                                    {group._count.contacts !== 1 ? 's' : ''}
                                </div>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='mt-3 w-full'
                                    onClick={() =>
                                        router.push(
                                            `/admin/contacts?groupId=${group.id}`,
                                        )
                                    }
                                >
                                    View Contacts
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog
                open={!!editingGroup}
                onOpenChange={(open) => !open && setEditingGroup(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Group</DialogTitle>
                    </DialogHeader>
                    {editingGroup && (
                        <form onSubmit={handleUpdate} className='space-y-4'>
                            <div>
                                <Label htmlFor='edit-name'>Group Name</Label>
                                <Input
                                    id='edit-name'
                                    name='name'
                                    required
                                    defaultValue={editingGroup.name}
                                />
                            </div>
                            <div>
                                <Label htmlFor='edit-description'>
                                    Description (optional)
                                </Label>
                                <Input
                                    id='edit-description'
                                    name='description'
                                    defaultValue={
                                        editingGroup.description || ''
                                    }
                                />
                            </div>
                            <div>
                                <Label>Color</Label>
                                <div className='flex gap-2 mt-2'>
                                    {COLORS.map((color) => (
                                        <label
                                            key={color}
                                            className='cursor-pointer'
                                        >
                                            <input
                                                type='radio'
                                                name='color'
                                                value={color}
                                                defaultChecked={
                                                    color ===
                                                    (editingGroup.color ||
                                                        COLORS[0])
                                                }
                                                className='sr-only peer'
                                            />
                                            <div
                                                className='w-6 h-6 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-gray-400 transition-all'
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className='flex justify-end gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => setEditingGroup(null)}
                                >
                                    Cancel
                                </Button>
                                <Button type='submit' disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
