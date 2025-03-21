'use client';

import React, { useEffect, useState } from 'react';

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
            className='data-[state=checked]:bg-main'
            defaultChecked={isAllDay}
            onCheckedChange={(checked) => setIsAllDay(checked)}
          />
        </div>

        <div className='flex items-center justify-between space-x-2'>
          <Label htmlFor='all-day'>開始</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !selectedStartDate && 'text-muted-foreground'
                )}>
                <CalendarIcon />
                {selectedStartDate ? format(selectedStartDate, 'PPP', { locale: ja }) : <span>開始日を選択</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
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
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className='flex items-center justify-between space-x-2'>
          <Label htmlFor='all-day'>終了</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !selectedEndDate && 'text-muted-foreground'
                )}>
                <CalendarIcon />
                {selectedEndDate ? format(selectedEndDate, 'PPP', { locale: ja }) : <span>終了日を選択</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
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
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className='w-full items-center md:justify-between'>
          <Button
            variant={'destructive'}
            onClick={() => {
              deleteEvent(event?.id || 0);
              handleDialogOpenClose(false);
              resetValues();
            }}>
            削除する
          </Button>
          <div className='flex items-center gap-2'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  handleDialogOpenClose(false);
                  resetValues();
                }}>
                キャンセル
              </Button>
            </DialogClose>
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
