'use client';

import React, { useEffect, useState } from 'react';

import { CalendarDialog } from '@/components/calendarDialog';
import { CalendarDrawer } from '@/components/calendarDrawer';
import { Button } from '@/components/shadcn-ui/button';
import { Calendar } from '@/components/shadcn-ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/shadcn-ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/shadcn-ui/drawer';
import { ScrollArea } from '@/components/shadcn-ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  set,
  startOfWeek,
  subMonths,
  subWeeks
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Edit, Plus, Trash } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
}

export default function Page() {
  const supabase = createClient();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // helper function to calculate event positions
  const calculateEventPositions = (eventsForWeek: Event[]) => {
    if (!eventsForWeek || eventsForWeek.length === 0) return {};

    // イベントを開始日でソート
    const sortedEvents = [...eventsForWeek].sort((a, b) => {
      const aStart = new Date(a.start);
      const bStart = new Date(b.start);

      // 開始日が同じ場合は終了日の遅い順
      if (aStart.getTime() === bStart.getTime()) {
        const aEnd = new Date(a.end);
        const bEnd = new Date(b.end);
        return bEnd.getTime() - aEnd.getTime();
      }

      return aStart.getTime() - bStart.getTime();
    });

    const positions: Record<number, number> = {};
    const usedTracks: { [key: string]: boolean }[] = [];

    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // イベントの期間中の各日付をチェック
      let trackIndex = 0;
      let found = false;

      while (!found) {
        if (!usedTracks[trackIndex]) {
          usedTracks[trackIndex] = {};
        }

        let canUseTrack = true;
        const currentDate = new Date(eventStart);

        while (currentDate <= eventEnd) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          if (usedTracks[trackIndex][dateKey]) {
            canUseTrack = false;
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (canUseTrack) {
          // このトラックが使用可能な場合、日付を予約
          const reserveDate = new Date(eventStart);
          while (reserveDate <= eventEnd) {
            const dateKey = format(reserveDate, 'yyyy-MM-dd');
            usedTracks[trackIndex][dateKey] = true;
            reserveDate.setDate(reserveDate.getDate() + 1);
          }
          positions[event.id] = trackIndex;
          found = true;
        } else {
          trackIndex++;
        }
      }
    });

    return positions;
  };

  // イベントの表示位置を計算する関数
  const getEventPosition = (event: Event, dateIndex: number, weekStart: Date) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const currentWeekEvents = events.filter((e) => {
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      const weekEnd = addDays(weekStart, 6);
      return eStart <= weekEnd && eEnd >= weekStart;
    });

    const positions = calculateEventPositions(currentWeekEvents);
    return positions[event.id] || 0;
  };

  // Generate week days when date changes
  useEffect(() => {
    if (date) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      setCurrentWeek(days);
    }
  }, [date]);

  useEffect(() => {
    getAllSchedules();
  }, []);

  /************************
   * FOR CALENDAR
   ************************/
  // Handle navigation to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (date) {
      const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
      setDate(newDate);
    }
  };

  // Format month for header display
  const formatMonthRange = () => {
    if (!date) return '';
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
  };

  // go back today
  const goBackToday = () => {
    setDate(new Date());
  };

  /****************
   * FOR DIALOG
   ****************/
  // handle dialog open/close
  const handleEditOpenClose = ({ isOpen, day, event }: { isOpen: boolean; day?: Date; event?: Event }) => {
    if (isOpen) {
      if (event) {
        // イベントがある場合は、そのイベントの日時をそのまま使用
        setSelectedEvent(event);
        setSelectedDate(new Date(event.start));
        setEditOpen(isOpen);
      } else if (day) {
        // 新規作成の場合は、選択された日付を使用
        setSelectedDate(day);
        setSelectedEvent(undefined);
        setEditOpen(isOpen);
      }

      // 日付が変更された場合は、カレンダーの表示も更新
      if (date && day && format(day, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) {
        setDate(day);
      }

      // ダイアログが開いている場合は閉じる
      if (dialogOpen) {
        setDialogOpen(false);
      }
    } else {
      setEditOpen(isOpen);
      setSelectedDate(undefined);
      setSelectedEvent(undefined);
    }
  };

  const handleDialogOpenClose = ({ isOpen, day, event }: { isOpen: boolean; day?: Date; event?: Event }) => {
    if (isOpen) {
      if (event) {
        // イベントがある場合は、そのイベントの日時をそのまま使用
        setSelectedEvent(event);
        setSelectedDate(new Date(event.start));
        setDialogOpen(isOpen);
      } else if (day) {
        // 新規作成の場合は、選択された日付を使用
        setSelectedDate(day);
        setSelectedEvent(undefined);
        setEditOpen(isOpen);
      }

      // 日付が変更された場合は、カレンダーの表示も更新
      if (date && day && format(day, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) {
        setDate(day);
      }
    } else {
      setDialogOpen(isOpen);
      setSelectedDate(undefined);
      setSelectedEvent(undefined);
    }
  };

  /****************
   * FOR SUPABASE
   ****************/
  // Get all schedules
  const getAllSchedules = async () => {
    let { data: calendar, error } = await supabase.from('calendar').select('*');

    if (error) {
      console.error('Error fetching calendar:', error.message);
      return;
    }

    // Convert UTC dates to JST and ensure end dates are handled correctly
    const localEvents =
      calendar?.map((event) => {
        // PostgreSQLのtimestamptzからJST時刻に変換
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        // 終日イベントの場合は日付のみを使用
        if (event.all_day) {
          return {
            ...event,
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd')
          };
        }

        // 時間指定イベントの場合は、JSTでの時刻を保持
        // タイムゾーンオフセットを考慮して調整（UTCからJSTへの変換）
        const jstStart = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60 * 1000);
        const jstEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60 * 1000);

        return {
          ...event,
          start: format(jstStart, "yyyy-MM-dd'T'HH:mm"),
          end: format(jstEnd, "yyyy-MM-dd'T'HH:mm")
        };
      }) || [];

    setEvents(localEvents);
  };

  // Create events
  const createEvent = async (scheduleData: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>) => {
    // Create Date objects with the correct timezone
    const startDate = new Date(scheduleData.start);
    const endDate = new Date(scheduleData.end);

    // 終日イベントの場合は日付のみを使用
    if (scheduleData.all_day) {
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('calendar')
        .insert([
          {
            title: scheduleData.title,
            start,
            end,
            all_day: scheduleData.all_day
          }
        ])
        .select();

      if (error) {
        console.error('Error inserting event:', error.message);
        return;
      }

      await getAllSchedules();
      return;
    }

    // 時間指定イベントの場合は、タイムゾーンを考慮してUTCに変換
    const utcStart = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000);
    const utcEnd = new Date(endDate.getTime() + endDate.getTimezoneOffset() * 60 * 1000);

    const { data, error } = await supabase
      .from('calendar')
      .insert([
        {
          title: scheduleData.title,
          start: utcStart.toISOString(),
          end: utcEnd.toISOString(),
          all_day: scheduleData.all_day
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting event:', error.message);
      return;
    }

    await getAllSchedules();
  };

  // Update event
  const updateEvent = async (
    id: number,
    { title, start, end, all_day }: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>
  ) => {
    // Create Date objects with the correct timezone
    const startDate = new Date(start);
    const endDate = new Date(end);

    // 終日イベントの場合は日付のみを使用
    if (all_day) {
      const newStart = format(startDate, 'yyyy-MM-dd');
      const newEnd = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('calendar')
        .update({
          title,
          start: newStart,
          end: newEnd,
          all_day
        })
        .match({ id })
        .select();

      if (error) {
        console.error('Error updating event:', error.message);
        return;
      }

      await getAllSchedules();
      return;
    }

    // 時間指定イベントの場合は、タイムゾーンを考慮してUTCに変換
    const utcStart = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000);
    const utcEnd = new Date(endDate.getTime() + endDate.getTimezoneOffset() * 60 * 1000);

    const { data, error } = await supabase
      .from('calendar')
      .update({
        title,
        start: utcStart.toISOString(),
        end: utcEnd.toISOString(),
        all_day
      })
      .match({ id })
      .select();

    if (error) {
      console.error('Error updating event:', error.message);
      return;
    }

    await getAllSchedules();
  };

  // delete event
  const deleteEvent = async (id: number) => {
    const { error } = await supabase.from('calendar').delete().match({ id });

    if (error) {
      console.error('Error deleting event:', error.message);
      return;
    }

    setEvents(events.filter((event) => event.id !== id));
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4 flex flex-col items-center justify-between gap-3 md:mb-2 md:flex-row md:gap-0'>
        <div className='flex w-full items-center justify-between gap-4 md:w-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={goBackToday}
            className='border-main text-main hover:bg-main cursor-pointer text-xs hover:text-white md:text-sm'
            disabled={!date || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
            今月へ戻る
          </Button>
        </div>

        <div className='flex w-full items-center justify-between gap-4 md:w-auto'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => navigateMonth('prev')}
            className='size-6 cursor-pointer md:size-9'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <div className='text-sm font-medium'>{formatMonthRange()}</div>
          <Button
            variant='outline'
            size='icon'
            onClick={() => navigateMonth('next')}
            className='size-6 cursor-pointer md:size-9'>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='-mx-4 flex flex-1 md:mx-0'>
        <div
          className='h-full w-full flex-1'
          onTouchStart={(e) => {
            const touch = e.touches[0];
            let startX = touch.clientX;
            let startY = touch.clientY;
            let moved = false;
            const handleTouchMove = (e: TouchEvent) => {
              const touch = e.touches[0];
              if (Math.abs(touch.clientX - startX) > 50 || Math.abs(touch.clientY - startY) > 50) {
                moved = true;
              }
            };
            const handleTouchEnd = (e: TouchEvent) => {
              if (moved) {
                const endX = e.changedTouches[0].clientX;
                if (Math.abs(endX - startX) > 50) {
                  if (endX - startX > 0) {
                    navigateMonth('prev');
                  } else {
                    navigateMonth('next');
                  }
                }
              }

              window.removeEventListener('touchmove', handleTouchMove);
              window.removeEventListener('touchend', handleTouchEnd);
            };
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
          }}>
          <Calendar
            mode='single'
            selected={date}
            month={date}
            onSelect={(newDate) => {
              // Prevent deselection when clicking the same date twice
              if (newDate !== undefined || !date) {
                setDate(newDate);
              }
            }}
            className='flex h-full w-full p-0 md:p-3'
            locale={ja}
            weekStartsOn={1}
            formatters={{
              formatCaption: (jaDate) => {
                const date = new Date(jaDate);
                return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
              }
            }}
            classNames={{
              months: 'flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1',
              caption: 'hidden',
              month: 'space-y-4 w-full h-full flex flex-col',
              table: 'w-full h-full border-collapse space-y-1',
              head_row: '',
              row: 'w-full mt-2 border-b',
              cell: 'relative p-2 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
              day: 'absolute top-2 left-1/2 transform -translate-x-1/2 p-0 md:w-8 md:h-8 w-6 h-6 md:text-sm flex items-center justify-center rounded-full cursor-pointer text-xs',
              day_selected: 'bg-main text-white',
              day_today: 'text-accent-foreground bg-[#f7f7f7] aria-selected:bg-main aria-selected:text-white'
            }}
            components={{
              Row: (props) => {
                // Get start and end of current week
                const dates = props.dates.map((date) => new Date(date));
                const weekStart = props.dates[0];
                const weekEnd = props.dates[props.dates.length - 1];

                // 1. この週全体に関わるイベントを収集（週をまたぐイベントも含む）
                const eventsForWeek = events.filter((event) => {
                  const eventStart = new Date(event.start.split('T')[0]);
                  const eventEnd = new Date(event.end.split('T')[0]);

                  // 週の範囲内に少なくとも1日含まれているイベント
                  return (
                    (eventStart <= weekEnd && eventEnd >= weekStart) ||
                    (eventStart >= weekStart && eventStart <= weekEnd) ||
                    (eventEnd >= weekStart && eventEnd <= weekEnd)
                  );
                });

                // 2. すべてのイベントの位置を一括で計算（週全体で）
                const positions = calculateEventPositions(eventsForWeek);

                return (
                  <tr className='gird relative mt-2 w-full grid-cols-7 border-b'>
                    {props.dates.map((date, dateIndex) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const today = props.dates[dateIndex];

                      // calculate event per date.
                      const eventsForDate = events.filter((event) => {
                        const eventStart = new Date(event.start.split('T')[0]);
                        const eventEnd = new Date(event.end.split('T')[0]);
                        const currentDate = new Date(today);

                        return (
                          (eventStart <= currentDate && eventEnd >= currentDate) ||
                          format(eventStart, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') ||
                          format(eventEnd, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                        );
                      });

                      // 1. Find single-day events for this date
                      const singleDayEvents = events
                        .filter(
                          (event) =>
                            format(date, 'yyyy-MM-dd') === format(event.start, 'yyyy-MM-dd') &&
                            format(event.start, 'yyyy-MM-dd') === format(event.end, 'yyyy-MM-dd')
                        )
                        // all_dayがtrueの場合は配列の最初に追加
                        .sort((a, b) => (a.all_day ? -1 : 1));

                      // 2. Find multi-day events that START on this specific date
                      const multiDayEventsStartingHere = events.filter((event) => {
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        return (
                          format(date, 'yyyy-MM-dd') === format(eventStart, 'yyyy-MM-dd') &&
                          format(eventEnd, 'yyyy-MM-dd') !== format(eventStart, 'yyyy-MM-dd')
                        );
                      });

                      // 3. Find multi-day events that CONTINUE through this date (started in previous week)
                      const continuingEvents = events.filter((event) => {
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        return (
                          format(date, 'yyyy-MM-dd') > format(eventStart, 'yyyy-MM-dd') &&
                          format(date, 'yyyy-MM-dd') <= format(eventEnd, 'yyyy-MM-dd') &&
                          format(date, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')
                        );
                      });

                      return (
                        <td
                          className='[&:has([aria-selected])]:bg-accent relative py-2 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md'
                          key={dateIndex}>
                          <div
                            className='grid h-full w-full cursor-pointer grid-rows-[auto_1fr] text-xs'
                            onClick={() =>
                              handleDialogOpenClose({
                                isOpen: true,
                                day: date,
                                event: events.find(
                                  (event) => format(date, 'yyyy-MM-dd') === format(event.start, 'yyyy-MM-dd')
                                )
                              })
                            }>
                            <div className='flex items-center justify-center'>
                              <span
                                className={
                                  format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                    ? 'bg-main inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white md:text-xs'
                                    : 'text-primary inline-flex size-5 items-center justify-center rounded-full text-[10px] md:text-xs'
                                }>
                                {format(date, 'd')}
                              </span>
                            </div>
                            <div className='min-h-[30px] overflow-hidden'>
                              {dateIndex === 0 &&
                                continuingEvents.map((event) => {
                                  const eventEnd = new Date(event.end);
                                  const weekStart = props.dates[0];
                                  const daysInThisWeek = Math.min(differenceInDays(eventEnd, weekStart) + 1, 7);
                                  const position = getEventPosition(event, dateIndex, weekStart);

                                  return (
                                    <div
                                      className={cn(
                                        'absolute left-0.5 z-10 flex w-full items-center justify-start gap-px rounded-xs px-2 py-0.5 text-[8px] font-bold md:gap-2 md:text-xs',
                                        event.all_day
                                          ? 'bg-main hover:bg-main/80 text-white'
                                          : 'hover:bg-muted outline-main outline -outline-offset-1 outline-dashed'
                                      )}
                                      style={{
                                        width: `calc(${daysInThisWeek * 100}% - 4px)`,
                                        maxWidth: `calc(${daysInThisWeek * 100}% - 4px)`,
                                        top: `${isDesktop ? 30 + position * 24 : 30 + position * 18}px`
                                      }}
                                      key={`continuing-${event.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditOpenClose({
                                          isOpen: true,
                                          day: date,
                                          event
                                        });
                                      }}>
                                      {!event.all_day && <div className='bg-main h-2 w-2 flex-shrink-0 rounded-full' />}
                                      <p className='truncate'>
                                        {!event.all_day && (
                                          <span className='mr-1'>{format(event.start, 'HH:mm')}~</span>
                                        )}
                                        {event.title}
                                      </p>
                                    </div>
                                  );
                                })}

                              {multiDayEventsStartingHere.map((event) => {
                                const eventStart = new Date(event.start);
                                const eventEnd = new Date(event.end);
                                const weekStart = props.dates[0];
                                const daysVisibleInWeek = Math.min(
                                  differenceInDays(weekEnd, eventStart) + 2,
                                  differenceInDays(eventEnd, eventStart) + 1,
                                  7 - dateIndex
                                );
                                const position = getEventPosition(event, dateIndex, weekStart);

                                return (
                                  <div
                                    className={cn(
                                      'absolute left-0.5 z-10 flex w-full items-center justify-start gap-px rounded-xs px-2 py-0.5 text-[8px] font-bold md:gap-2 md:text-xs',
                                      event.all_day
                                        ? 'bg-main hover:bg-main/80 text-white'
                                        : 'hover:bg-muted outline-main outline -outline-offset-1 outline-dashed'
                                    )}
                                    style={{
                                      width: `calc(${daysVisibleInWeek * 100}% - 4px)`,
                                      maxWidth: `calc(${daysVisibleInWeek * 100}% - 4px)`,
                                      top: `${isDesktop ? 30 + position * 24 : 30 + position * 18}px`
                                    }}
                                    key={event.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditOpenClose({
                                        isOpen: true,
                                        day: date,
                                        event
                                      });
                                    }}>
                                    {!event.all_day && <div className='bg-main h-2 w-2 flex-shrink-0 rounded-full' />}
                                    <p className='truncate'>
                                      {!event.all_day && <span className='mr-1'>{format(event.start, 'HH:mm')}~</span>}
                                      {event.title}
                                    </p>
                                  </div>
                                );
                              })}

                              {singleDayEvents
                                .slice(
                                  0,
                                  Math.max(
                                    0,
                                    3 -
                                      (dateIndex === 0 ? continuingEvents.length : 0) -
                                      multiDayEventsStartingHere.length
                                  )
                                )
                                .map((event, index) => {
                                  return (
                                    <div
                                      className={cn(
                                        'absolute left-0.5 z-10 flex w-full items-center justify-start gap-px rounded-xs px-2 py-0.5 text-[8px] font-bold md:gap-2 md:text-xs',
                                        event.all_day ? 'bg-main hover:bg-main/80 text-white' : 'hover:bg-muted'
                                      )}
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditOpenClose({
                                          isOpen: true,
                                          day: date,
                                          event
                                        });
                                      }}
                                      style={{
                                        width: 'calc(100% - 4px)',
                                        maxWidth: 'calc(100% - 4px)',
                                        top: `${isDesktop ? 30 + (dateIndex === 0 ? continuingEvents.length : 0 + multiDayEventsStartingHere.length + index) * 24 : 30 + (dateIndex === 0 ? continuingEvents.length : 0 + multiDayEventsStartingHere.length + index) * 18}px`
                                      }}>
                                      {!event.all_day && <div className='bg-main h-2 w-2 flex-shrink-0 rounded-full' />}
                                      <p className='truncate'>
                                        {!event.all_day && (
                                          <span className='mr-1'>{format(event.start, 'HH:mm')}~</span>
                                        )}
                                        {event.title}
                                      </p>
                                    </div>
                                  );
                                })}

                              {/* more than 3 schedule */}
                              {eventsForDate.length > 3 && (
                                <div
                                  className='absolute left-0.5 z-10 truncate rounded-xs bg-white px-1 py-0.5 text-left text-[8px] font-bold hover:opacity-50 md:text-xs'
                                  style={{
                                    width: 'calc(100% - 4px)',
                                    maxWidth: 'calc(100% - 4px)',
                                    top: `${isDesktop ? 30 + 3 * 24 : 30 + 3 * 18}px`
                                  }}>
                                  他{eventsForDate.length - 3}件...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }
            }}
          />
        </div>
      </div>

      {/* schedule list modal */}
      {isDesktop ? (
        <Dialog open={dialogOpen} onOpenChange={() => handleDialogOpenClose({ isOpen: false })}>
          <DialogContent className='p-4 sm:max-w-xl'>
            <DialogTitle className='text-sm font-bold'>
              {selectedDate && format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}の予定
            </DialogTitle>
            <DialogDescription className='hidden' />

            <ScrollArea className='max-h-80'>
              <div className='flex flex-col gap-2'>
                {events
                  .filter(
                    (event) =>
                      format(new Date(event.start), 'yyyy-MM-dd') ===
                      (selectedDate && format(selectedDate, 'yyyy-MM-dd'))
                  )
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map((event) => (
                    <div key={event.id} className='flex items-center justify-between border-b p-3 hover:bg-gray-50'>
                      <div className='flex items-center'>
                        <div className='mr-3 h-10 w-2 rounded-sm bg-amber-500'></div>
                        <div>
                          <p className='text-sm font-semibold'>{event.title}</p>
                          <span className='text-xs text-gray-600'>
                            {event.all_day
                              ? '終日'
                              : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`}
                          </span>
                        </div>
                      </div>
                      <div className='flex space-x-2'>
                        <Button
                          type='button'
                          size={'xs'}
                          variant={'ghost'}
                          onClick={() => handleEditOpenClose({ isOpen: true, event })}>
                          <Edit size={8} />
                        </Button>
                        <Button size={'xs'} variant={'ghost'} onClick={() => deleteEvent(event.id)}>
                          <Trash size={8} className='text-destructive' />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                variant={'main'}
                size={'sm'}
                className='rounded-sm'
                onClick={() => handleEditOpenClose({ isOpen: true, day: selectedDate })}>
                <Plus size={8} />
                予定を追加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={dialogOpen} onOpenChange={() => handleDialogOpenClose({ isOpen: false })}>
          <DrawerContent className='h-full !max-h-[98svh] gap-4 px-4'>
            <DrawerHeader className='p-0'>
              <DrawerTitle className='text-sm font-bold'>
                {selectedDate && format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}の予定
              </DrawerTitle>
              <DrawerDescription className='hidden'></DrawerDescription>
            </DrawerHeader>

            <ScrollArea className='max-h-80'>
              <div className='flex flex-col gap-2'>
                {events
                  .filter(
                    (event) =>
                      format(new Date(event.start), 'yyyy-MM-dd') ===
                      (selectedDate && format(selectedDate, 'yyyy-MM-dd'))
                  )
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map((event) => (
                    <div key={event.id} className='flex items-center justify-between border-b p-3 hover:bg-gray-50'>
                      <div className='flex items-center'>
                        <div className='mr-3 h-10 w-2 rounded-sm bg-amber-500'></div>
                        <div>
                          <p className='text-sm font-semibold'>{event.title}</p>
                          <span className='text-xs text-gray-600'>
                            {event.all_day
                              ? '終日'
                              : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`}
                          </span>
                        </div>
                      </div>
                      <div className='flex space-x-2'>
                        <Button
                          type='button'
                          size={'xs'}
                          variant={'ghost'}
                          onClick={() => handleEditOpenClose({ isOpen: true, event })}>
                          <Edit size={8} />
                        </Button>
                        <Button size={'xs'} variant={'ghost'} onClick={() => deleteEvent(event.id)}>
                          <Trash size={8} className='text-destructive' />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            <DrawerFooter className='px-0'>
              <Button
                variant={'main'}
                size={'sm'}
                onClick={() => handleEditOpenClose({ isOpen: true, day: selectedDate })}>
                <Plus size={8} />
                予定を追加
              </Button>
              <DrawerClose asChild>
                <Button type='button' variant='ghost'>
                  キャンセル
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* edit modal */}
      {isDesktop ? (
        <CalendarDialog
          open={editOpen}
          selectedDate={selectedDate!}
          event={selectedEvent}
          handleEditOpenClose={handleEditOpenClose}
          createEvent={createEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
        />
      ) : (
        <CalendarDrawer
          open={editOpen}
          selectedDate={selectedDate!}
          event={selectedEvent}
          handleEditOpenClose={handleEditOpenClose}
          createEvent={createEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}
