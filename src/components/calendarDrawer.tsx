'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/shadcn-ui/button';
import { Calendar } from '@/components/shadcn-ui/calendar';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/shadcn-ui/drawer';
import { Input } from '@/components/shadcn-ui/input';
import { Label } from '@/components/shadcn-ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn-ui/popover';
import { ScrollArea, ScrollBar } from '@/components/shadcn-ui/scroll-area';
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

export function CalendarDrawer({
  open,
  selectedDate,
  event,
  handleEditOpenClose,
  updateEvent,
  deleteEvent,
  createEvent
}: {
  open: boolean;
  selectedDate: Date;
  event?: Event;
  handleEditOpenClose: ({ isOpen }: { isOpen: boolean }) => void;
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

      if (event) {
        // イベントがある場合は、そのイベントの日時をそのまま使用
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        // 終日イベントの場合は日付のみを使用
        if (event.all_day) {
          setSelectedStartDate(startDate);
          setSelectedEndDate(endDate);
        } else {
          // タイムゾーンオフセットを考慮して調整
          const jstStart = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60 * 1000);
          const jstEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60 * 1000);
          setSelectedStartDate(jstStart);
          setSelectedEndDate(jstEnd);
        }
        setIsAllDay(event.all_day);
      } else {
        // 新規作成の場合は、選択された日付を使用
        setSelectedStartDate(selectedDate);
        setSelectedEndDate(selectedDate);
        setIsAllDay(true);
      }
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
    <Drawer open={open} onOpenChange={(isOpen) => handleEditOpenClose({ isOpen })}>
      <DrawerContent className='h-full !max-h-[98svh]'>
        <DrawerHeader className='p-0'>
          <DrawerTitle className='text-sm font-bold'></DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>

        <ScrollArea className='h-full overflow-y-auto'>
          <div className='grid gap-4 p-4'>
            <Input
              placeholder='タイトル'
              defaultValue={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className='selection:bg-main/80 w-full rounded-none border-0 text-2xl shadow-none ring-0 selection:text-white focus:shadow-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0'
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
                  className={cn(
                    'w-fit justify-start text-left font-normal',
                    !selectedStartDate && 'text-muted-foreground'
                  )}
                  onClick={() => toggleAccordion(1)}>
                  <CalendarIcon />
                  {selectedStartDate && isAllDay ? (
                    format(selectedStartDate, 'PPP', { locale: ja })
                  ) : (
                    <>
                      {selectedStartDate ? (
                        <>
                          {format(selectedStartDate, 'PPP', { locale: ja })}
                          <span className=''>{format(selectedStartDate, 'p', { locale: ja })}</span>
                        </>
                      ) : (
                        <span>開始日を選択</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
              <div className='accordion hidden w-full transition-all' id='accordion-1'>
                <div className='grid grid-rows-[1fr_auto] items-center'>
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
                  {!isAllDay && (
                    <div className='flex h-fit w-full flex-col items-center divide-y sm:flex-row sm:divide-x sm:divide-y-0'>
                      <ScrollArea className='w-[calc(100vw-64px)]'>
                        <div className='flex p-2 sm:flex-col'>
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <Button
                              key={hour}
                              size='icon'
                              variant={selectedStartDate?.getHours() === hour ? 'main' : 'ghost'}
                              className='aspect-square shrink-0 sm:w-full'
                              onClick={() => {
                                setSelectedStartDate((prev) => {
                                  if (!prev) return new Date();
                                  return new Date(prev.setHours(hour));
                                });
                              }}>
                              {hour}
                            </Button>
                          ))}
                        </div>
                        <ScrollBar orientation='horizontal' className='sm:hidden' />
                      </ScrollArea>
                      <ScrollArea className='w-[calc(100vw-64px)]'>
                        <div className='flex p-2 sm:flex-col'>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                            <Button
                              key={minute}
                              size='icon'
                              variant={selectedStartDate?.getMinutes() === minute ? 'main' : 'ghost'}
                              className='aspect-square shrink-0 sm:w-full'
                              onClick={() => {
                                setSelectedStartDate((prev) => {
                                  if (!prev) return new Date();
                                  return new Date(prev.setMinutes(minute));
                                });
                              }}>
                              {minute.toString().padStart(2, '0')}
                            </Button>
                          ))}
                        </div>
                        <ScrollBar orientation='horizontal' className='sm:hidden' />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='flex flex-col items-center justify-between'>
              <div className='flex w-full items-center justify-between'>
                <Label htmlFor='all-day'>終了</Label>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-fit justify-start text-left font-normal',
                    !selectedEndDate && 'text-muted-foreground'
                  )}
                  onClick={() => toggleAccordion(2)}>
                  <CalendarIcon />
                  {selectedEndDate && isAllDay ? (
                    format(selectedEndDate, 'PPP', { locale: ja })
                  ) : (
                    <>
                      {selectedEndDate ? (
                        <>
                          {format(selectedEndDate, 'PPP', { locale: ja })}
                          <span className=''>{format(selectedEndDate, 'p', { locale: ja })}</span>
                        </>
                      ) : (
                        <span>終了日を選択</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
              <div className='accordion hidden w-full transition-all' id='accordion-2'>
                <div className='grid grid-rows-[1fr_auto] items-center'>
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
                  {!isAllDay && (
                    <div className='flex h-fit w-fit flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0'>
                      <ScrollArea className='w-[calc(100vw-32px)]'>
                        <div className='flex p-2 sm:flex-col'>
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <Button
                              key={hour}
                              size='icon'
                              variant={selectedEndDate?.getHours() === hour ? 'main' : 'ghost'}
                              className='aspect-square shrink-0 sm:w-full'
                              onClick={() => {
                                setSelectedEndDate((prev) => {
                                  if (!prev) return new Date();
                                  return new Date(prev.setHours(hour));
                                });
                              }}>
                              {hour}
                            </Button>
                          ))}
                        </div>
                        <ScrollBar orientation='horizontal' className='hidden' />
                      </ScrollArea>
                      <ScrollArea className='w-[calc(100vw-32px)]'>
                        <div className='flex p-2 sm:flex-col'>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                            <Button
                              key={minute}
                              size='icon'
                              variant={selectedEndDate?.getMinutes() === minute ? 'main' : 'ghost'}
                              className='aspect-square shrink-0 sm:w-full'
                              onClick={() => {
                                setSelectedEndDate((prev) => {
                                  if (!prev) return new Date();
                                  return new Date(prev.setMinutes(minute));
                                });
                              }}>
                              {minute.toString().padStart(2, '0')}
                            </Button>
                          ))}
                        </div>
                        <ScrollBar orientation='horizontal' className='hidden' />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter>
          <Button
            type='button'
            variant='main'
            disabled={!inputValue || !selectedStartDate}
            onClick={() => {
              if (event) {
                updateEvent(event.id, {
                  title: inputValue,
                  start: selectedStartDate
                    ? isAllDay
                      ? format(selectedStartDate, 'yyyy-MM-dd')
                      : selectedStartDate.toLocaleString('sv', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T')
                    : format(selectedDate, 'yyyy-MM-dd'),
                  end: selectedEndDate
                    ? isAllDay
                      ? format(selectedEndDate, 'yyyy-MM-dd')
                      : selectedEndDate.toLocaleString('sv', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T')
                    : format(selectedDate, 'yyyy-MM-dd'),
                  all_day: isAllDay
                });
              } else {
                createEvent({
                  title: inputValue,
                  start: selectedStartDate
                    ? isAllDay
                      ? format(selectedStartDate, 'yyyy-MM-dd')
                      : selectedStartDate.toLocaleString('sv', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T')
                    : format(selectedDate, 'yyyy-MM-dd'),
                  end: selectedEndDate
                    ? isAllDay
                      ? format(selectedEndDate, 'yyyy-MM-dd')
                      : selectedEndDate.toLocaleString('sv', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T')
                    : format(selectedDate, 'yyyy-MM-dd'),
                  all_day: isAllDay
                });
              }

              handleEditOpenClose({ isOpen: false });
              resetValues();
            }}>
            保存する
          </Button>
          {event && (
            <Button
              variant={'outline'}
              onClick={() => {
                deleteEvent(event?.id || 0);
                handleEditOpenClose({ isOpen: false });
                resetValues();
              }}
              className='text-destructive hover:bg-destructive border-destructive hover:text-white'>
              削除する
            </Button>
          )}
          <DrawerClose asChild>
            <Button
              type='button'
              variant='ghost'
              onClick={() => {
                handleEditOpenClose({ isOpen: false });
                resetValues();
              }}>
              キャンセル
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
