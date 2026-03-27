'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Palette } from 'lucide-react';

export function ThemeSettings({
    theme,
    onThemeChange,
}: {
    theme: any;
    onThemeChange: (newTheme: any) => void;
}) {
    const handleChange = (key: string, value: string) => {
        onThemeChange({ ...theme, [key]: value });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant='outline'>
                    <Palette className='mr-2 h-4 w-4' />
                    Customize Theme
                </Button>
            </SheetTrigger>
            <SheetContent className='overflow-y-auto w-[400px]'>
                <SheetHeader>
                    <SheetTitle>Email Theme Settings</SheetTitle>
                    <SheetDescription>
                        Customize the colors and style of this email campaign.
                    </SheetDescription>
                </SheetHeader>

                <div className='grid gap-6 py-6'>
                    <div className='space-y-4'>
                        <h3 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                            Global
                        </h3>
                        <div className='grid gap-2'>
                            <Label>Background Color</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.backgroundColor || '#f6f9fc'}
                                    onChange={(e) =>
                                        handleChange(
                                            'backgroundColor',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.backgroundColor || '#f6f9fc'}
                                    onChange={(e) =>
                                        handleChange(
                                            'backgroundColor',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Text Color</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.textColor || '#333333'}
                                    onChange={(e) =>
                                        handleChange(
                                            'textColor',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.textColor || '#333333'}
                                    onChange={(e) =>
                                        handleChange(
                                            'textColor',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Link Color</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.linkColor || '#0070f3'}
                                    onChange={(e) =>
                                        handleChange(
                                            'linkColor',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.linkColor || '#0070f3'}
                                    onChange={(e) =>
                                        handleChange(
                                            'linkColor',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <h3 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                            Sections
                        </h3>
                        <div className='grid gap-2'>
                            <Label>Header Background</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.headerBg || '#ffffff'}
                                    onChange={(e) =>
                                        handleChange('headerBg', e.target.value)
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.headerBg || '#ffffff'}
                                    onChange={(e) =>
                                        handleChange('headerBg', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Pre-Body Background</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.emailHeaderBg || '#eef2f5'}
                                    onChange={(e) =>
                                        handleChange(
                                            'emailHeaderBg',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.emailHeaderBg || '#eef2f5'}
                                    onChange={(e) =>
                                        handleChange(
                                            'emailHeaderBg',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Pre-Footer Background</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.preFooterBg || '#f0f0f0'}
                                    onChange={(e) =>
                                        handleChange(
                                            'preFooterBg',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.preFooterBg || '#f0f0f0'}
                                    onChange={(e) =>
                                        handleChange(
                                            'preFooterBg',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Footer Background</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.footerBg || '#2a2a2a'}
                                    onChange={(e) =>
                                        handleChange('footerBg', e.target.value)
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.footerBg || '#2a2a2a'}
                                    onChange={(e) =>
                                        handleChange('footerBg', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <Label>Footer Text Color</Label>
                            <div className='flex gap-2'>
                                <Input
                                    type='color'
                                    className='w-12 h-10 p-1 cursor-pointer'
                                    value={theme.footerText || '#ffffff'}
                                    onChange={(e) =>
                                        handleChange(
                                            'footerText',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    type='text'
                                    value={theme.footerText || '#ffffff'}
                                    onChange={(e) =>
                                        handleChange(
                                            'footerText',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <h3 className='font-medium text-sm text-gray-500 uppercase tracking-wider'>
                            Social Media
                        </h3>
                        <div className='grid gap-2'>
                            <Label>Facebook URL</Label>
                            <Input
                                value={theme.socialFacebook || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'socialFacebook',
                                        e.target.value,
                                    )
                                }
                                placeholder='https://facebook.com/...'
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label>Twitter (X) URL</Label>
                            <Input
                                value={theme.socialTwitter || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'socialTwitter',
                                        e.target.value,
                                    )
                                }
                                placeholder='https://twitter.com/...'
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label>Instagram URL</Label>
                            <Input
                                value={theme.socialInstagram || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'socialInstagram',
                                        e.target.value,
                                    )
                                }
                                placeholder='https://instagram.com/...'
                            />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
