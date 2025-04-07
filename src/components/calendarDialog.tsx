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
import { ScrollArea, ScrollBar } from '@/components/shadcn-ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn-ui/select';
import { Separator } from '@/components/shadcn-ui/separator';
import { Switch } from '@/components/shadcn-ui/switch';
import { cn } from '@/lib/utils';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Clock, Timer } from 'lucide-react';

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

  // 日本時間とUTC時間の変換ヘルパー関数
  const convertToUTC = (date: Date): Date => {
    // JST（日本時間）からUTCへの変換
    // タイムゾーンオフセットを考慮し、JST時間をUTCに変換
    return new Date(date.getTime() - 9 * 60 * 60 * 1000);
  };

  const convertToJST = (utcDate: Date): Date => {
    // UTC時間からJST（日本時間）への変換
    // 与えられたUTC時間に9時間を加算して日本時間に変換
    return new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  };

  // set initial values
  useEffect(() => {
    if (open) {
      // Initialize with event data or defaults when modal opens
      setInputValue(event?.title ?? '');

      if (event) {
        // イベントがある場合は、そのイベントの日時をJST時間に変換して使用
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        if (event.all_day) {
          // 終日イベントの場合は時間は気にせず日付のみを使用
          setSelectedStartDate(new Date(startDate));
          setSelectedEndDate(new Date(endDate));
        } else {
          // すでにUTCで保存されているデータをJST時間に変換
          const jstStart = convertToJST(startDate);
          const jstEnd = convertToJST(endDate);
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

  // イベント保存時にUTC時間に変換する処理
  const formatDateForSave = (date: Date, isAllDay: boolean): string => {
    if (isAllDay) {
      // 終日イベントの場合は日付のみを返す
      return format(date, 'yyyy-MM-dd');
    } else {
      // 時間指定イベントの場合は、選択された日本時間をUTC形式に変換して返す
      const utcDate = convertToUTC(date);
      return utcDate.toISOString();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        handleEditOpenClose({ isOpen });
        resetValues();
      }}>
      <DialogContent
        className='p-4 sm:max-w-xl'
        onPointerDownOutside={(e) => {
          e.preventDefault();
          handleEditOpenClose({ isOpen: false });
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
              className={cn(
                'w-[250px] justify-start text-left font-normal',
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
            <div className='grid grid-cols-[1fr_auto] items-center gap-2'>
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
                <div className='flex w-full flex-col gap-4 p-4'>
                  <div className='flex items-center gap-4'>
                    <Clock className='text-muted-foreground h-4 w-4' />
                    <div className='flex items-center gap-2'>
                      <Select
                        value={selectedStartDate?.getHours().toString()}
                        onValueChange={(value) => {
                          setSelectedStartDate((prev) => {
                            if (!prev) return new Date();
                            const newDate = new Date(prev);
                            newDate.setHours(parseInt(value));
                            return newDate;
                          });
                        }}>
                        <SelectTrigger className='w-[80px]'>
                          <SelectValue placeholder='時間' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select
                        value={selectedStartDate?.getMinutes().toString()}
                        onValueChange={(value) => {
                          setSelectedStartDate((prev) => {
                            if (!prev) return new Date();
                            const newDate = new Date(prev);
                            newDate.setMinutes(parseInt(value));
                            return newDate;
                          });
                        }}>
                        <SelectTrigger className='w-[80px]'>
                          <SelectValue placeholder='分' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                            <SelectItem key={minute} value={minute.toString()}>
                              {minute.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                'w-[250px] justify-start text-left font-normal',
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
            <div className='grid grid-cols-[1fr_auto] items-center gap-2'>
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
                <div className='flex w-full flex-col gap-4 p-4'>
                  <div className='flex items-center gap-4'>
                    <Clock className='text-muted-foreground h-4 w-4' />
                    <div className='flex items-center gap-2'>
                      <Select
                        value={selectedEndDate?.getHours().toString()}
                        onValueChange={(value) => {
                          setSelectedEndDate((prev) => {
                            if (!prev) return new Date();
                            const newDate = new Date(prev);
                            newDate.setHours(parseInt(value));
                            return newDate;
                          });
                        }}>
                        <SelectTrigger className='w-[80px]'>
                          <SelectValue placeholder='時間' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select
                        value={selectedEndDate?.getMinutes().toString()}
                        onValueChange={(value) => {
                          setSelectedEndDate((prev) => {
                            if (!prev) return new Date();
                            const newDate = new Date(prev);
                            newDate.setMinutes(parseInt(value));
                            return newDate;
                          });
                        }}>
                        <SelectTrigger className='w-[80px]'>
                          <SelectValue placeholder='分' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                            <SelectItem key={minute} value={minute.toString()}>
                              {minute.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className='flex w-full flex-col gap-2 pt-6'>
            <Button
              type='button'
              variant='main'
              disabled={!inputValue || !selectedStartDate}
              onClick={() => {
                if (event) {
                  updateEvent(event.id, {
                    title: inputValue,
                    start: selectedStartDate
                      ? formatDateForSave(selectedStartDate, isAllDay)
                      : format(selectedDate, 'yyyy-MM-dd'),
                    end: selectedEndDate
                      ? formatDateForSave(selectedEndDate, isAllDay)
                      : format(selectedDate, 'yyyy-MM-dd'),
                    all_day: isAllDay
                  });
                } else {
                  createEvent({
                    title: inputValue,
                    start: selectedStartDate
                      ? formatDateForSave(selectedStartDate, isAllDay)
                      : format(selectedDate, 'yyyy-MM-dd'),
                    end: selectedEndDate
                      ? formatDateForSave(selectedEndDate, isAllDay)
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
