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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [editOpen, setEditOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // helper function to calculate event positions
  const calculateEventPositions = (eventsForWeek: Event[]) => {
    if (!eventsForWeek || eventsForWeek.length === 0) return {};

    // ソート順を変更:
    // 1. 開始日が早い順
    // 2. 同じ開始日の場合、複数日イベントを先に（※優先順位を変更）
    // 3. 同じ開始日の複数日イベントは長い順
    const sortedEvents = [...eventsForWeek].sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();

      // eventのall_dayがtrueの場合、優先度を上げる
      if (a.all_day !== b.all_day) {
        return a.all_day ? -1 : 1;
      }

      // 開始日が異なる場合は開始日の早い順
      if (aStart !== bStart) {
        return aStart - bStart;
      }

      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();

      // 片方が単日イベントの場合、複数日イベントを優先（※変更点）
      const aIsSingleDay = a.start === a.end;
      const bIsSingleDay = b.start === b.end;

      if (aIsSingleDay !== bIsSingleDay) {
        return aIsSingleDay ? 1 : -1; // 複数日イベントを先に
      }

      // 両方とも単日、または両方とも複数日の場合は長いイベントを優先
      return bEnd - aEnd;
    });

    // イベント位置の割り当て
    const positions: Record<number, number> = {};
    const tracks: Array<{
      end: number; // 終了時間（タイムスタンプ）
      startDates: string[]; // このトラックに配置されたイベントの開始日（日付文字列）
      endDates: string[]; // このトラックに配置されたイベントの終了日（日付文字列）
    }> = [];

    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // 日付のみの文字列表現（YYYY-MM-DD形式）
      const eventStartDateStr = format(eventStart, 'yyyy-MM-dd');
      const eventEndDateStr = format(eventEnd, 'yyyy-MM-dd');

      // 重なりを判定する関数
      const doesOverlap = (track: (typeof tracks)[0]) => {
        // このトラックの各イベントについて日付の重なりを確認
        for (let i = 0; i < track.startDates.length; i++) {
          const trackStartDate = track.startDates[i];
          const trackEndDate = track.endDates[i];

          // 日付の重なりチェック:
          // 1. イベントの開始日がトラックの開始日と終了日の間にある または
          // 2. イベントの終了日がトラックの開始日と終了日の間にある または
          // 3. イベントがトラックのイベントを完全に包含する または
          // 4. トラックのイベントがこのイベントを完全に包含する
          if (
            (eventStartDateStr >= trackStartDate && eventStartDateStr <= trackEndDate) ||
            (eventEndDateStr >= trackStartDate && eventEndDateStr <= trackEndDate) ||
            (eventStartDateStr <= trackStartDate && eventEndDateStr >= trackEndDate) ||
            (trackStartDate <= eventStartDateStr && trackEndDate >= eventEndDateStr)
          ) {
            return true; // 重なりがある
          }
        }
        return false; // 重なりがない
      };

      // 重ならないトラックを探す
      let trackIndex = tracks.findIndex((track) => !doesOverlap(track));

      if (trackIndex === -1) {
        // 空きトラックがなければ新しいトラックを追加
        trackIndex = tracks.length;
        tracks.push({
          end: 0,
          startDates: [],
          endDates: []
        });
      }

      // イベントの位置を記録
      positions[event.id] = trackIndex;

      // トラックの情報を更新
      tracks[trackIndex].end = eventEnd.getTime();
      tracks[trackIndex].startDates.push(eventStartDateStr);
      tracks[trackIndex].endDates.push(eventEndDateStr);
    });

    return positions;
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
  // Handle navigation to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (date) {
      const newDate = direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1);
      setDate(newDate);
    }
  };

  // Handle navigation to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (date) {
      const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
      setDate(newDate);
    }
  };

  // Format week range for header display
  const formatWeekRange = () => {
    if (currentWeek.length === 0) return '';

    const firstDay = currentWeek[0];
    const lastDay = currentWeek[currentWeek.length - 1];

    return `${format(firstDay, 'yyyy年MM月dd日')} ~ ${format(lastDay, 'MM月dd日')}`;
  };

  // Format month for header display
  const formatMonthRange = () => {
    if (!date) return '';
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setViewMode(value as 'month' | 'week');
  };

  // Navigate based on current view mode
  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      navigateWeek(direction);
    } else {
      navigateMonth(direction);
    }
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
      if (!date || (day && format(day, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd'))) {
        setDate(day);
      }

      setSelectedDate(day);

      if (dialogOpen) {
        setDialogOpen(false);
      }

      if (event) {
        setSelectedEvent(event);
        setEditOpen(isOpen);
      } else {
        setSelectedEvent(undefined);
        setEditOpen(isOpen);
      }
    } else {
      setEditOpen(isOpen);
      setSelectedDate(undefined);
      setSelectedEvent(undefined);
    }
  };

  const handleDialogOpenClose = ({ isOpen, day, event }: { isOpen: boolean; day?: Date; event?: Event }) => {
    if (isOpen) {
      if (!date || (day && format(day, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd'))) {
        setDate(day);
      }

      setSelectedDate(day);

      if (event) {
        setSelectedEvent(event);
        setDialogOpen(isOpen);
      } else {
        setEditOpen(isOpen);
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

    setEvents(calendar || []);
  };

  // Create events
  const createEvent = async (scheduleData: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>) => {
    const { data, error } = await supabase
      .from('calendar')
      .insert([
        {
          title: scheduleData.title,
          // Convert date to ISO string
          start: new Date(scheduleData.start).toISOString(),
          end: new Date(scheduleData.end).toISOString(),
          all_day: scheduleData.all_day
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting event:', error.message);
      return;
    }

    setEvents([...events, data[0]]);
  };

  // Update event
  const updateEvent = async (
    id: number,
    { title, start, end, all_day }: Pick<Event, 'title' | 'start' | 'end' | 'all_day'>
  ) => {
    const { data, error } = await supabase
      .from('calendar')
      .update({ title, start: new Date(start).toISOString(), end: new Date(end).toISOString(), all_day })
      .match({ id })
      .select();

    if (error) {
      console.error('Error updating event:', error.message);
      return;
    }

    setEvents(events.map((event) => (event.id === id ? data[0] : event)));
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
          <Tabs defaultValue='week' value={viewMode} onValueChange={handleTabChange} className='w-[200px]'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='month' className='cursor-pointer text-xs md:text-sm'>
                月表示
              </TabsTrigger>
              <TabsTrigger value='week' className='cursor-pointer text-xs md:text-sm'>
                週表示
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant='outline'
            size='sm'
            onClick={goBackToday}
            className='border-main text-main hover:bg-main cursor-pointer text-xs hover:text-white md:text-sm'
            disabled={!date || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
            {viewMode === 'week' ? '今週' : '今月'}へ戻る
          </Button>
        </div>

        <div className='flex w-full items-center justify-between gap-4 md:w-auto'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => navigate('prev')}
            className='size-6 cursor-pointer md:size-9'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <div className='text-sm font-medium'>{viewMode === 'week' ? formatWeekRange() : formatMonthRange()}</div>
          <Button
            variant='outline'
            size='icon'
            onClick={() => navigate('next')}
            className='size-6 cursor-pointer md:size-9'>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='flex flex-1 gap-x-2'>
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
                    navigate('prev');
                  } else {
                    navigate('next');
                  }
                }
              }

              window.removeEventListener('touchmove', handleTouchMove);
              window.removeEventListener('touchend', handleTouchEnd);
            };
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
          }}>
          {viewMode === 'month' ? (
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

                          return (
                            format(eventStart, 'yyyy-MM-dd').includes(format(today, 'yyyy-MM-dd')) ||
                            format(eventEnd, 'yyyy-MM-dd').includes(format(today, 'yyyy-MM-dd'))
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
                                {singleDayEvents.slice(0, 3).map((event, index) => {
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
                                        top: `${isDesktop ? 30 + index * 22 : 30 + index * 16}px`
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

                                {multiDayEventsStartingHere
                                  .slice(0, Math.max(0, 3 - singleDayEvents.length))
                                  .map((event, index) => {
                                    const eventStart = new Date(event.start);
                                    const eventEnd = new Date(event.end);
                                    const daysVisibleInWeek = Math.min(
                                      differenceInDays(weekEnd, eventStart) + 2,
                                      differenceInDays(eventEnd, eventStart) + 1,
                                      7 - dateIndex
                                    );

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
                                          top: `${isDesktop ? 30 + (singleDayEvents.length + index) * 22 : 30 + (singleDayEvents.length + index) * 16}px`
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
                                        {!event.all_day && (
                                          <div className='bg-main h-2 w-2 flex-shrink-0 rounded-full' />
                                        )}
                                        <p className='truncate'>
                                          {!event.all_day && (
                                            <span className='mr-1'>{format(event.start, 'HH:mm')}~</span>
                                          )}
                                          {event.title}
                                        </p>
                                      </div>
                                    );
                                  })}

                                {dateIndex === 0 &&
                                  continuingEvents
                                    .slice(
                                      0,
                                      Math.max(0, 3 - singleDayEvents.length - multiDayEventsStartingHere.length)
                                    )
                                    .map((event, index) => {
                                      const eventEnd = new Date(event.end);
                                      const weekStart = currentWeek[0];
                                      const daysInThisWeek = Math.min(differenceInDays(eventEnd, weekStart) + 1, 7);

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
                                            top: `${isDesktop ? 30 + (singleDayEvents.length + multiDayEventsStartingHere.length + index) * 22 : 30 + (singleDayEvents.length + multiDayEventsStartingHere.length + index) * 16}px`
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
                                          {!event.all_day && (
                                            <div className='bg-main h-2 w-2 flex-shrink-0 rounded-full' />
                                          )}
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
                                    className='absolute left-0.5 z-10 truncate rounded-xs bg-white px-1 py-0.5 text-left text-[8px] font-bold md:text-xs'
                                    style={{
                                      width: 'calc(100% - 4px)',
                                      maxWidth: 'calc(100% - 4px)',
                                      top: `${isDesktop ? 30 + 3 * 22 : 30 + 3 * 16}px`
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
          ) : (
            <div className='h-[calc(100%-8px)] w-full rounded-md border md:h-full'>
              <div className='grid h-full grid-cols-7'>
                {currentWeek.map((day, dateIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');

                  // 週全体に関わるイベントを収集
                  const weekEvents = events.filter((event) => {
                    const eventStart = new Date(event.start.split('T')[0]);
                    const eventEnd = new Date(event.end.split('T')[0]);
                    return (
                      (eventStart <= currentWeek[6] && eventEnd >= currentWeek[0]) ||
                      (eventStart >= currentWeek[0] && eventStart <= currentWeek[6]) ||
                      (eventEnd >= currentWeek[0] && eventEnd <= currentWeek[6])
                    );
                  });

                  // 週全体のイベント位置を計算
                  const positions = calculateEventPositions(weekEvents);

                  // 1. Find single-day events for this date
                  const singleDayEvents = events.filter(
                    (event) =>
                      format(day, 'yyyy-MM-dd') === format(event.start, 'yyyy-MM-dd') &&
                      format(event.start, 'yyy-MM-dd') === format(event.end, 'yyyy-MM-dd')
                  );

                  // 2. Find multi-day events that START on this specific date
                  const multiDayEventsStartingHere = events.filter((event) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    return (
                      format(day, 'yyyy-MM-dd') === format(eventStart, 'yyyy-MM-dd') &&
                      format(eventEnd, 'yyyy-MM-dd') !== format(eventStart, 'yyyy-MM-dd')
                    );
                  });

                  // 3. Find multi-day events that CONTINUE through this date (started in previous week)
                  const continuingEvents = events.filter((event) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    return (
                      format(day, 'yyyy-MM-dd') > format(eventStart, 'yyyy-MM-dd') &&
                      format(day, 'yyyy-MM-dd') <= format(eventEnd, 'yyyy-MM-dd') &&
                      dateIndex === 0 // Only show on the first day of the week
                    );
                  });

                  return (
                    <div
                      key={dateIndex}
                      className={`relative flex cursor-pointer flex-col border-r py-2 last:border-r-0 ${
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-accent/28' : ''
                      } ${
                        date && format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          ? 'ring-main rounded-md ring-1'
                          : ''
                      }`}
                      onClick={() =>
                        handleDialogOpenClose({
                          isOpen: true,
                          day,
                          event: events.find((event) => format(day, 'yyyy-MM-dd') === format(event.start, 'yyyy-MM-dd'))
                        })
                      }>
                      <div className='mb-2 text-center'>
                        <div className='text-muted-foreground text-xs'>{format(day, 'E', { locale: ja })}</div>
                        <div
                          className={`text-sm font-medium ${
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                              ? 'text-primary font-bold'
                              : ''
                          } `}>
                          {format(day, 'd')}
                        </div>
                      </div>
                      <div className='relative min-h-[100px] flex-1'>
                        {singleDayEvents.slice(0, 2).map((event) => {
                          // 計算された位置を使用
                          const position = positions[event.id] !== undefined ? positions[event.id] : 0;
                          const topOffset = position * 22 + 2;

                          return (
                            <div
                              className={cn(
                                'absolute left-0.5 z-10 flex w-full items-center justify-start gap-2 rounded-xs px-2 py-0.5 text-[8px] font-bold md:text-xs',
                                event.all_day ? 'bg-main hover:bg-main/80 text-white' : 'hover:bg-muted'
                              )}
                              key={event.id}
                              style={{
                                width: 'calc(100% - 4px)',
                                maxWidth: 'calc(100% - 4px)',
                                top: `${topOffset}px`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOpenClose({
                                  isOpen: true,
                                  day,
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

                        {multiDayEventsStartingHere.slice(0, Math.max(0, 2 - singleDayEvents.length)).map((event) => {
                          const eventStart = new Date(event.start);
                          const eventEnd = new Date(event.end);
                          const daysLeft = Math.min(differenceInDays(eventEnd, eventStart) + 1, 7 - dateIndex);

                          // 計算された位置を使用
                          const position = positions[event.id] !== undefined ? positions[event.id] : 0;
                          const topOffset = position * 22 + 2;

                          return (
                            <div
                              className={cn(
                                'absolute left-0.5 z-10 flex w-full items-center justify-start gap-2 rounded-xs px-2 py-0.5 text-[8px] font-bold md:text-xs',
                                event.all_day
                                  ? 'bg-main hover:bg-main/80 text-white'
                                  : 'hover:bg-muted outline-main outline -outline-offset-1 outline-dashed'
                              )}
                              style={{
                                width: `calc(${daysLeft * 100}% - 4px)`,
                                maxWidth: `calc(${daysLeft * 100}% - 4px)`,
                                top: `${topOffset}px`
                              }}
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOpenClose({
                                  isOpen: true,
                                  day,
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

                        {continuingEvents
                          .slice(0, Math.max(0, 2 - singleDayEvents.length - multiDayEventsStartingHere.length))
                          .map((event) => {
                            const eventEnd = new Date(event.end);
                            const weekStart = day;
                            const daysInThisWeek = Math.min(differenceInDays(eventEnd, weekStart) + 1, 7);

                            // 計算された位置を使用
                            const position = positions[event.id] !== undefined ? positions[event.id] : 0;
                            const topOffset = position * 22 + 2;

                            return (
                              <div
                                className={cn(
                                  'absolute left-0.5 z-10 flex w-full items-center justify-start gap-2 rounded-xs px-2 py-0.5 text-[8px] font-bold md:text-xs',
                                  event.all_day
                                    ? 'bg-main hover:bg-main/80 text-white'
                                    : 'hover:bg-muted outline-main outline -outline-offset-1 outline-dashed'
                                )}
                                style={{
                                  width: `calc(${daysInThisWeek * 100}% - 4px)`,
                                  maxWidth: `calc(${daysInThisWeek * 100}% - 4px)`,
                                  top: `${topOffset}px`
                                }}
                                key={`continuing-${event.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditOpenClose({
                                    isOpen: true,
                                    day,
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

                        {/* more than 3 schedule */}
                        {singleDayEvents.length + multiDayEventsStartingHere.length + continuingEvents.length > 2 && (
                          <div
                            className='absolute left-0.5 z-10 truncate rounded-xs px-1 py-0.5 text-[8px] font-bold md:text-xs'
                            style={{
                              width: 'calc(100% - 4px)',
                              maxWidth: 'calc(100% - 4px)',
                              top: isDesktop ? 28 + 2 * 22 : 30 + 2 * 16
                            }}>
                            他{singleDayEvents.length + multiDayEventsStartingHere.length + continuingEvents.length - 2}
                            件...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
