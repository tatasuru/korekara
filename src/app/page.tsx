'use client';

import React from 'react';

import { Calendar } from '@/components/shadcn-ui/calendar';

export default function Page() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className='w-full px-8'>
      <div className='flex gap-x-2'>
        <div className='h-screen w-full flex-1'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={setDate}
            className='flex h-full w-full'
            classNames={{
              months: 'flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1',
              month: 'space-y-4 w-full flex flex-col',
              table: 'w-full h-full border-collapse space-y-1',
              head_row: '',
              row: 'w-full mt-2'
            }}
          />
        </div>
      </div>
    </div>
  );
}
