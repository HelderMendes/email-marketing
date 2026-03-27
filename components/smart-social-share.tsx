'use client';

import React, {
    useState,
    useCallback,
    useSyncExternalStore,
    useEffect,
} from 'react';
import { Check, Copy, LogIn, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

// ============ TYPES ============
type SocialPlatform =
    | 'facebook'
    | 'twitter'
    | 'linkedin'
    | 'instagram'
    | 'email';

type User = {
    id: number;
    name: string;
    avatarInitial: string;
};

type ShareContent = {
    title: string;
    message: string;
    url?: string;
};

type StatusType = 'idle' | 'success' | 'error' | 'copying';

// ============ CUSTOM HOOK: User Session Management ============
const STORAGE_KEY = 'socialShareUser';

const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
};

const useUserSession = () => {
    const user = useSyncExternalStore(subscribe, getStoredUser, () => null);
    const [localUser, setLocalUser] = useState<User | null>(user);

    const login = useCallback((name: string): User | null => {
        if (!name.trim()) return null;

        const newUser: User = {
            id: Date.now(),
            name: name.trim(),
            avatarInitial: name.trim().charAt(0).toUpperCase(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setLocalUser(newUser);
        return newUser;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setLocalUser(null);
    }, []);

    return { user: localUser ?? user, login, logout };
};

// ============ SHARE URL GENERATORS ============
const getShareUrl = (
    platform: SocialPlatform,
    content: ShareContent,
): string => {
    const encodedText = encodeURIComponent(content.message);
    const encodedUrl = encodeURIComponent(content.url || window.location.href);
    const encodedTitle = encodeURIComponent(content.title);

    switch (platform) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        case 'email':
            return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
        case 'instagram':
            // Instagram doesn't have a web share URL, copy to clipboard instead
            return '';
        default:
            return '';
    }
};

// ============ SOCIAL ICONS ============
const SocialIcon: React.FC<{ platform: SocialPlatform; fill?: string }> = ({
    platform,
    fill = '#ffffff',
}) => {
    const icons: Record<SocialPlatform, React.ReactNode> = {
        facebook: (
            <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
        ),
        instagram: (
            <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
        ),
        twitter: (
            <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
        ),
        linkedin: (
            <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
        ),
        email: (
            <path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
        ),
    };

    return (
        <svg viewBox='0 0 24 24' className='w-5 h-5' style={{ fill }}>
            {icons[platform]}
        </svg>
    );
};

// ============ SINGLE SHARE BUTTON ============
type SmartShareButtonProps = {
    platform: SocialPlatform;
    content: ShareContent;
    iconBg?: string;
    iconColor?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
};

export const SmartShareButton: React.FC<SmartShareButtonProps> = ({
    platform,
    content,
    iconBg = '#333333',
    iconColor = '#ffffff',
    size = 'md',
    showLabel = false,
}) => {
    const { user, login, logout } = useUserSession();
    const [status, setStatus] = useState<StatusType>('idle');
    const [showLoginPopover, setShowLoginPopover] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const platformLabels: Record<SocialPlatform, string> = {
        facebook: 'Facebook',
        twitter: 'X (Twitter)',
        linkedin: 'LinkedIn',
        instagram: 'Instagram',
        email: 'Email',
    };

    const copyToClipboard = async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    };

    const handleShare = async () => {
        // For platforms that need login simulation
        if (!user && platform !== 'email') {
            setShowLoginPopover(true);
            return;
        }

        setStatus('copying');

        try {
            const shareUrl = getShareUrl(platform, content);

            if (platform === 'instagram') {
                // Instagram: copy message to clipboard
                const shareText = `${content.message}\n\n${content.url || window.location.href}`;
                const copied = await copyToClipboard(shareText);
                if (copied) {
                    setStatus('success');
                    setTimeout(() => setStatus('idle'), 2000);
                } else {
                    throw new Error('Failed to copy');
                }
                return;
            }

            if (platform === 'email') {
                // Email: open mailto link
                window.location.href = shareUrl;
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
                return;
            }

            // Other platforms: open share URL in popup
            const width = 600;
            const height = 400;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            window.open(
                shareUrl,
                `share_${platform}`,
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
            );

            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleLogin = () => {
        const name = window.prompt(
            `Log in to share on ${platformLabels[platform]}\nEnter your display name:`,
            'Guest User',
        );
        if (name?.trim()) {
            login(name.trim());
            setShowLoginPopover(false);
            // Auto-share after login
            setTimeout(handleShare, 100);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
                return <Check className='w-4 h-4 text-green-500' />;
            case 'error':
                return <X className='w-4 h-4 text-red-500' />;
            case 'copying':
                return <Copy className='w-4 h-4 animate-pulse' />;
            default:
                return null;
        }
    };

    // Render placeholder during SSR to avoid hydration mismatch
    if (!mounted) {
        return (
            <button
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg relative group`}
                style={{ backgroundColor: iconBg }}
                title={`Share on ${platformLabels[platform]}`}
            >
                <SocialIcon platform={platform} fill={iconColor} />
            </button>
        );
    }

    return (
        <Popover open={showLoginPopover} onOpenChange={setShowLoginPopover}>
            <PopoverTrigger asChild>
                <button
                    onClick={handleShare}
                    className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg relative group`}
                    style={{ backgroundColor: iconBg }}
                    title={
                        user || platform === 'email'
                            ? `Share on ${platformLabels[platform]}`
                            : `Log in to share on ${platformLabels[platform]}`
                    }
                >
                    {status !== 'idle' ? (
                        getStatusIcon()
                    ) : (
                        <SocialIcon platform={platform} fill={iconColor} />
                    )}
                    {!user && platform !== 'email' && (
                        <span className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white' />
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent className='w-64'>
                <div className='space-y-3'>
                    <h4 className='font-medium text-sm'>🔐 Login Required</h4>
                    <p className='text-xs text-gray-500'>
                        Log in to share this campaign on{' '}
                        {platformLabels[platform]}.
                    </p>
                    {user ? (
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <span className='w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center'>
                                    {user.avatarInitial}
                                </span>
                                <span className='text-sm'>{user.name}</span>
                            </div>
                            <Button size='sm' variant='ghost' onClick={logout}>
                                <LogOut className='w-4 h-4' />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size='sm'
                            onClick={handleLogin}
                            className='w-full'
                        >
                            <LogIn className='w-4 h-4 mr-2' />
                            Log in to Share
                        </Button>
                    )}
                </div>
            </PopoverContent>
            {showLabel && (
                <span className='text-xs text-gray-500 mt-1'>
                    {platformLabels[platform]}
                </span>
            )}
        </Popover>
    );
};

// ============ SHARE BAR (Multiple buttons) ============
type SmartShareBarProps = {
    content: ShareContent;
    platforms?: SocialPlatform[];
    iconBg?: string;
    iconColor?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    className?: string;
};

export const SmartShareBar: React.FC<SmartShareBarProps> = ({
    content,
    platforms = ['facebook', 'twitter', 'linkedin', 'email'],
    iconBg,
    iconColor,
    size = 'md',
    showLabels = false,
    className = '',
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {platforms.map((platform) => (
                <div key={platform} className='flex flex-col items-center'>
                    <SmartShareButton
                        platform={platform}
                        content={content}
                        iconBg={iconBg}
                        iconColor={iconColor}
                        size={size}
                        showLabel={showLabels}
                    />
                </div>
            ))}
        </div>
    );
};

// ============ COPY CAMPAIGN BUTTON ============
type CopyCampaignButtonProps = {
    content: ShareContent;
    className?: string;
};

export const CopyCampaignButton: React.FC<CopyCampaignButtonProps> = ({
    content,
    className = '',
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = `${content.title}\n\n${content.message}\n\n${content.url || ''}`;
        try {
            await navigator.clipboard.writeText(text.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    return (
        <Button
            variant='outline'
            size='sm'
            onClick={handleCopy}
            className={className}
        >
            {copied ? (
                <>
                    <Check className='w-4 h-4 mr-2 text-green-500' />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className='w-4 h-4 mr-2' />
                    Copy Campaign
                </>
            )}
        </Button>
    );
};

export default SmartShareBar;
