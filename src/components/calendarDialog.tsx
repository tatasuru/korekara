'use client';

import React, { useEffect, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn-ui/accordion';
import { Button } from '@/components/shadcn-ui/button';
import { Calendar } from '@/components/shadcn-ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from '@/components/shadcn-ui/dialog';
import { Input } from '@/components/shadcn-ui/input';
import { Label } from '@/components/shadcn-ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn-ui/popover';
import { Separator } from '@/components/shadcn-ui/separator';
import { Switch } from '@/components/shadcn-ui/switch';
import { cn } from '@/lib/utils';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
}

export function CalendarDialog({
  open,
  selectedDate,
  event,
  handleDialogOpenClose,
  updateEvent,
  deleteEvent,
  createEvent
}: {
  open: boolean;
  selectedDate: Date;
  event?: Event;
  handleDialogOpenClose: (isOpen: boolean) => void;
  updateEvent: (id: number, data: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>) => void;
  deleteEvent: (id: number) => void;
  createEvent: (data: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [isAllDay, setIsAllDay] = useState(true);

  // set initial values
  useEffect(() => {
    if (open) {
      // Initialize with event data or defaults when modal opens
      setInputValue(event?.title ?? '');
      setSelectedStartDate(event?.start ? new Date(event.start) : selectedDate);
      setSelectedEndDate(event?.end ? new Date(event.end) : selectedDate);
      setIsAllDay(event?.all_day ?? true);
    }
  }, [open, selectedDate, event]);

  const resetValues = () => {
    setInputValue('');
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setIsAllDay(true);
  };

  const toggleAccordion = (index: number) => {
    const accordion = document.getElementById(`accordion-${index}`);
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach((acc) => {
      if (acc !== accordion) {
        acc.classList.add('hidden');
      } else {
        acc.classList.toggle('hidden');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenClose}>
      <DialogContent
        className='p-4 sm:max-w-md'
        onPointerDownOutside={(e) => {
          e.preventDefault();
          handleDialogOpenClose(false);
        }}>
        <DialogTitle className='text-sm font-bold'>予定を編集</DialogTitle>
        <DialogDescription className='hidden' />
        <Input
          placeholder='タイトル'
          defaultValue={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className='selection:bg-main/80 w-full rounded-none border-0 shadow-none ring-0 selection:text-white focus:shadow-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 md:text-2xl'
        />

        <Separator />

        <div className='flex items-center justify-between space-x-2'>
          <Label htmlFor='all-day'>終日</Label>
          <Switch
            id='all-day'
            size={'default'}
            className='data-[state=checked]:bg-main'
            defaultChecked={isAllDay}
            onCheckedChange={(checked) => setIsAllDay(checked)}
          />
        </div>

        <div className='flex flex-col items-center justify-between'>
          <div className='flex w-full items-center justify-between'>
            <Label htmlFor='all-day'>開始</Label>
            <Button
              variant={'outline'}
              className={cn('w-fit justify-start text-left font-normal', !selectedStartDate && 'text-muted-foreground')}
              onClick={() => toggleAccordion(1)}>
              <CalendarIcon />
              {selectedStartDate ? format(selectedStartDate, 'PPP', { locale: ja }) : <span>開始日を選択</span>}
            </Button>
          </div>
          <div className='accordion hidden w-full transition-all' id='accordion-1'>
            <Calendar
              mode='single'
              locale={ja}
              defaultMonth={selectedStartDate}
              selected={selectedStartDate}
              onSelect={(newDate) => {
                setSelectedStartDate(newDate);
              }}
              formatters={{
                formatCaption: (jaDate) => {
                  const date = new Date(jaDate);
                  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                }
              }}
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1 w-full',
                month: 'space-y-4 w-full h-full flex flex-col',
                table: 'w-full h-full space-y-1',
                head_row: '',
                head: 'text-muted-foreground',
                head_cell: 'text-muted-foreground rounded-md w-6 font-normal text-[0.8rem]',
                row: 'w-full mt-2',
                cell: 'relative text-center text-sm focus-within:relative',
                day_selected: 'bg-main text-white hover:bg-main/90 hover:text-white'
              }}
            />
          </div>
        </div>

        <div className='flex flex-col items-center justify-between'>
          <div className='flex w-full items-center justify-between'>
            <Label htmlFor='all-day'>終了</Label>
            <Button
              variant={'outline'}
              className={cn('w-fit justify-start text-left font-normal', !selectedEndDate && 'text-muted-foreground')}
              onClick={() => toggleAccordion(2)}>
              <CalendarIcon />
              {selectedEndDate ? format(selectedEndDate, 'PPP', { locale: ja }) : <span>終了日を選択</span>}
            </Button>
          </div>
          <div className='accordion hidden w-full transition-all' id='accordion-2'>
            <Calendar
              mode='single'
              locale={ja}
              defaultMonth={selectedEndDate}
              selected={selectedEndDate}
              onSelect={(newDate) => {
                setSelectedEndDate(newDate);
              }}
              formatters={{
                formatCaption: (jaDate) => {
                  const date = new Date(jaDate);
                  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                }
              }}
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1 w-full',
                month: 'space-y-4 w-full h-full flex flex-col',
                table: 'w-full h-full space-y-1',
                head_row: '',
                head: 'text-muted-foreground',
                head_cell: 'text-muted-foreground rounded-md w-6 font-normal text-[0.8rem]',
                row: 'w-full mt-2',
                cell: 'relative text-center text-sm focus-within:relative',
                day_selected: 'bg-main text-white hover:bg-main/90 hover:text-white'
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <div className='flex w-full flex-col gap-2 pt-6'>
            <Button
              type='button'
              variant='main'
              onClick={() => {
                if (event) {
                  updateEvent(event.id, {
                    title: inputValue,
                    start: selectedStartDate
                      ? format(selectedStartDate, 'yyyy-MM-dd')
                      : format(selectedDate, 'yyyy-MM-dd'),
                    end: selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
                    all_day: isAllDay
                  });
                } else {
                  createEvent({
                    title: inputValue,
                    start: selectedStartDate
                      ? format(selectedStartDate, 'yyyy-MM-dd')
                      : format(selectedDate, 'yyyy-MM-dd'),
                    end: selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
                    all_day: isAllDay
                  });
                }

                handleDialogOpenClose(false);
                resetValues();
              }}>
              保存する
            </Button>
            {/* <DialogClose asChild>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    handleDialogOpenClose(false);
                    resetValues();
                  }}>
                  キャンセル
                </Button>
              </DialogClose> */}
            {event && (
              <Button
                variant={'outline'}
                onClick={() => {
                  deleteEvent(event?.id || 0);
                  handleDialogOpenClose(false);
                  resetValues();
                }}
                className='text-destructive hover:bg-destructive border-destructive hover:text-white'>
                削除する
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
