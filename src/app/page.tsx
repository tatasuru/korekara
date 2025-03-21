'use client';

import React, { useEffect, useState } from 'react';

import { CalendarDialog } from '@/components/calendarDialog';
import { CalendarDrawer } from '@/components/calendarDrawer';
import { Button } from '@/components/shadcn-ui/button';
import { Calendar } from '@/components/shadcn-ui/calendar';
import { Input } from '@/components/shadcn-ui/input';
import { Label } from '@/components/shadcn-ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn-ui/popover';
import { Separator } from '@/components/shadcn-ui/separator';
import { Switch } from '@/components/shadcn-ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  set,
  startOfWeek,
  subMonths,
  subWeeks
} from 'date-fns';
import { ja, se } from 'date-fns/locale';
import { Edit, Trash } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { Copy } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const isDesktop = useMediaQuery('(min-width: 768px)');

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
  const handleDialogOpenClose = (isOpen: boolean, day?: Date, event?: Event) => {
    if (isOpen) {
      if (!date || (day && format(day, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd'))) {
        setDate(day);
      }

      setSelectedDate(day);

      if (event) {
        setSelectedEvent(event);
      }
    } else {
      setSelectedDate(undefined);
      setSelectedEvent(undefined);
    }

    setOpen(isOpen);
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
    console.log(scheduleData);
    const { data, error } = await supabase
      .from('calendar')
      .insert([
        {
          title: scheduleData.title,
          start: scheduleData.start,
          end: scheduleData.end,
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
      .update({ title, start, end, all_day })
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
        <div className='h-full w-full flex-1'>
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
                Day: (props) => {
                  return (
                    <div
                      className='grid h-full w-full cursor-pointer grid-rows-[auto_1fr] text-xs'
                      onClick={() => handleDialogOpenClose(true, props.date)}>
                      <div className='flex items-center justify-center'>
                        <span
                          className={
                            format(props.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                              ? 'bg-main inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white md:text-xs'
                              : 'text-primary inline-flex size-5 items-center justify-center rounded-full text-[10px] md:text-xs'
                          }>
                          {format(props.date, 'd')}
                        </span>
                      </div>
                      <div className='min-h-[30px] overflow-hidden'>
                        {events.map((event) => {
                          if (format(props.date, 'yyyy-MM-dd') === event.start) {
                            return (
                              <div
                                className='bg-main hover:bg-main/80 mt-1 truncate rounded px-1 py-0.5 text-[10px] font-bold text-white md:text-xs'
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDialogOpenClose(true, props.date, event);
                                }}>
                                {event.title}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                }
              }}
            />
          ) : (
            <div className='h-[calc(100%-8px)] w-full rounded-md border md:h-full'>
              <div className='grid h-full grid-cols-7'>
                {currentWeek.map((day, index) => (
                  <div
                    key={index}
                    className={`flex cursor-pointer flex-col border-r p-2 last:border-r-0 ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-accent/30' : ''} ${date && format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'ring-main rounded-md ring-1' : ''}`}
                    onClick={() => handleDialogOpenClose(true, day)}>
                    <div className='mb-2 text-center'>
                      <div className='text-muted-foreground text-xs'>{format(day, 'E', { locale: ja })}</div>
                      <div
                        className={`text-sm font-medium ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-primary font-bold' : ''} `}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className='flex-1'>
                      {events.map((event) => {
                        if (format(day, 'yyyy-MM-dd') === event.start) {
                          return (
                            <div
                              className='bg-main hover:bg-main/80 mt-1 truncate rounded px-1 py-0.5 text-[10px] font-bold text-white md:text-xs'
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDialogOpenClose(true, day, event);
                              }}>
                              {event.title}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* edit modal */}
      {isDesktop ? (
        <CalendarDialog
          open={open}
          selectedDate={selectedDate!}
          event={selectedEvent}
          handleDialogOpenClose={handleDialogOpenClose}
          createEvent={createEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
        />
      ) : (
        <CalendarDrawer
          open={open}
          selectedDate={selectedDate!}
          event={selectedEvent}
          handleDialogOpenClose={handleDialogOpenClose}
          createEvent={createEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}
