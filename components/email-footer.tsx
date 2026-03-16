import Link from 'next/link';

export function EmailFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <div className='bg-gray-100 p-8 text-sm text-gray-600 space-y-4'>
            <div className='text-center text-xs'>
                <p className='mb-4'>
                    Copyright © {currentYear} Look Out Mode, All rights
                    reserved.
                </p>
                <p className='mb-4 text-justify'>
                    U ontvangt deze nieuwsbrief van LOOK OUT Mode omdat u ons
                    daar toestemming voor heeft gegeven. Zo nu en dan sturen wij
                    u een mailtje over geplande uitverkopen, nieuwe collecties
                    en andere belangrijke dingen. Wij zullen het kort en
                    informatief houden. Beloofd!
                </p>
                <div className='border-t border-gray-300 pt-4 mt-4'>
                    <p className='mb-2 font-medium'>
                        Want to change how you receive these emails?
                    </p>
                    <p>
                        You can{' '}
                        <Link
                            href='/update-preferences'
                            className='underline text-gray-900 hover:text-black'
                        >
                            update your preferences
                        </Link>{' '}
                        or{' '}
                        <Link
                            href='/unsubscribe'
                            className='underline text-gray-900 hover:text-black'
                        >
                            unsubscribe from this list
                        </Link>
                    </p>
                </div>
                <div className='mt-8 pt-4 border-t border-gray-200'>
                    <p className='font-bold'>Contact:</p>
                    <p>Look Out B.V.</p>
                    <p>info@lookoutmode.nl</p>
                    <p>Huizerweg 45, Bussum, NH 1401 GH, Netherlands</p>
                </div>
            </div>
        </div>
    );
}
