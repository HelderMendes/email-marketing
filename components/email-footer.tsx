import Link from 'next/link';
import Image from 'next/image';

export function EmailFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <div className='bg-[#2a2a2a] p-8 text-sm text-white space-y-4'>
            <div className='text-center flex flex-col items-center max-w-lg mx-auto'>
                <p className='mb-2 text-sm'>
                    Copyright © {currentYear} Look Out Mode, All rights
                    reserved.
                </p>
                <div className='mb-2'>
                    <Link href='https://lookoutmode.nl/' target='_blank'>
                        <Image
                            src='https://lookoutmode.nl/LookOutMode_logo.jpg'
                            width={64}
                            height={20}
                            alt='Upload'
                            className='w-32 h-120 object-cover rounded'
                        />
                    </Link>
                </div>
                <p className='mb-8 text-6xl '>
                    Huizerweg 45 &ndash; 1401 GH, Bussum
                    <br />
                    Till the end of the world
                </p>
                <p className='mb-2 text-center text-[#aaaaaa] text-[14px] leading-relaxed'>
                    ontvangt deze nieuwsbrief van LOOK OUT MODE omdat u ons daar
                    toestemming voor heeft gegeven. Zo nu en dan sturen wij u
                    een mailtje over geplande uitverkopen, nieuwe collecties en
                    andere belangrijke dingen. Wij zullen het kort en
                    informatief houden. Beloofd!
                </p>
                <div className='mb-2 text-[14px]'>
                    <p className='mb-1'>
                        Want to change how you receive these emails?
                    </p>
                    <p>
                        You can{' '}
                        <Link
                            href='/update-preferences'
                            className='underline text-white hover:text-gray-300'
                        >
                            update your preferences
                        </Link>{' '}
                        or{' '}
                        <Link
                            href='/unsubscribe'
                            className='underline text-white hover:text-gray-300'
                        >
                            unsubscribe
                        </Link>{' '}
                        from this list.
                    </p>
                </div>
                U
                <div className='text-[13px]'>
                    <p>
                        <Link
                            href='/share'
                            className='underline text-white hover:text-gray-300'
                        >
                            Share the email campaigne with a friend
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
