'use client';

import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/shadcn-ui/badge';
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/shadcn-ui/drawer';
import { Input } from '@/components/shadcn-ui/input';
import { Label } from '@/components/shadcn-ui/label';
import { ScrollArea, ScrollBar } from '@/components/shadcn-ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '@/components/shadcn-ui/select';
import { Separator } from '@/components/shadcn-ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { TodoCard } from '@/components/todoCard';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { DndContext, type DragEndEvent, type DragOverEvent, MeasuringStrategy } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Plus, RotateCcw } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  order: number;
  due_date?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export default function Todos() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const supabase = createClient();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleTabChange = (value: string) => {
    setViewMode(value as 'list' | 'map');
  };

  async function fetchTodos() {
    const { data, error } = await supabase.from('todos').select('*').order('order', { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setTodos(data || []);
    }
  }

  async function addTodo() {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: inputValue,
        order: todos.length + 1,
        due_date: null,
        completed: false,
        priority: 'low'
      })
      .select('*')
      .order('id', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setTodos([...todos, data![0]]);
      setInputValue('');
    }
  }

  async function updateTodoStatus(id: string, completed: boolean) {
    const { error } = await supabase.from('todos').update({ completed }).match({ id });
    if (error) {
      console.error(error);
    } else {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo)));
    }
  }

  async function updateTodoContent({
    id,
    title,
    due_date,
    order,
    priority
  }: {
    id: string;
    title: string;
    due_date?: string;
    order?: number;
    priority?: 'low' | 'medium' | 'high';
  }) {
    const { error } = await supabase.from('todos').update({ title, due_date, order, priority }).match({ id });
    if (error) {
      console.error(error);
    } else {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                title,
                due_date,
                order: order ?? todo.order,
                priority
              }
            : todo
        )
      );
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from('todos').delete().match({ id });
    if (error) {
      console.error(error);
    } else {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }
  }

  function editTodo(id: string) {
    setSelectedTodo(todos.find((todo) => todo.id === id) || null);
    setOpen(true);
  }

  async function updateOrder(todoOrder: number, todoId: string) {
    return new Promise(async (resolve) => {
      const { error } = await supabase.from('todos').update({ order: todoOrder }).eq('id', todoId);

      if (error) {
        console.error(error);
      }

      resolve(true);
    });
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;

    console.log('Drag中:', {
      active: active.id,
      over: over?.id || 'なし'
    });

    if (over && active.id !== over.id) {
      setTodos((todos) => {
        const oldIndex = todos.findIndex((todo) => todo.id === active.id);
        const newIndex = todos.findIndex((todo) => todo.id === over.id);
        return arrayMove(todos, oldIndex, newIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, collisions } = event;

    console.log('Drag終了:', {
      active: collisions?.[0]?.id || active.id,
      over: collisions?.[1]?.id || over?.id
    });

    const activeId = collisions?.[0]?.id || active.id;
    const overId = collisions?.[1]?.id || over?.id;

    if (over && activeId !== overId) {
      const updatedTodos = [...todos];

      // Update the order property for each todo based on its new position
      const reorderedTodos = updatedTodos.map((todo, index) => ({
        ...todo,
        order: index + 1 // Order starts from 1
      }));

      setTodos(reorderedTodos);

      try {
        for (const todo of reorderedTodos) {
          await updateOrder(todo.order, todo.id);
        }
        console.log('Database order update completed:', reorderedTodos);
      } catch (error) {
        console.error('Error updating order:', error);
        fetchTodos();
      }
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

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

  // for bottom blur effect
  const [isBlur, setIsBlur] = useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const scrollAreaElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    if (scrollAreaElement) {
      const handleScrollEvent = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaElement;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 70;
        setIsBlur(!isAtBottom);
      };

      scrollAreaElement.addEventListener('scroll', handleScrollEvent);

      handleScrollEvent();

      return () => {
        scrollAreaElement.removeEventListener('scroll', handleScrollEvent);
      };
    }
  }, [scrollAreaRef.current]);

  return (
    <div className='grid h-full grid-rows-[auto_auto_1fr] gap-4 md:flex md:grid-cols-2 md:flex-col'>
      <div className='flex w-full items-center gap-2 md:max-w-2xl'>
        <Input
          type='text'
          placeholder='やることを入力...'
          className='w-full md:min-w-96'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Button
          type='button'
          variant={'main'}
          className='cursor-pointer gap-1 md:w-20'
          disabled={!inputValue}
          onClick={addTodo}>
          <Plus />
          追加
        </Button>
      </div>
      <Tabs defaultValue='list' value={viewMode} onValueChange={handleTabChange} className='md:w-[200px]'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='list' className='cursor-pointer text-xs md:text-sm'>
            リスト表示
          </TabsTrigger>
          <TabsTrigger value='map' className='cursor-pointer text-xs md:text-sm'>
            マップ表示
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {viewMode === 'list' ? (
        <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <ScrollArea
            ref={scrollAreaRef}
            className='relative h-[calc(100dvh-210px)] w-full overscroll-none md:h-[calc(100dvh-160px)] md:max-w-2xl'>
            <SortableContext items={todos.map((todo) => todo.id)}>
              <div className='flex flex-col gap-2'>
                {todos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    deleteTodo={deleteTodo}
                    updateTodoStatus={updateTodoStatus}
                    editTodo={editTodo}
                  />
                ))}
              </div>
            </SortableContext>
            <ScrollBar hidden={true} />
            <div
              className={cn('pointer-events-none absolute bottom-0 left-0 h-10 w-full', isBlur ? 'flex' : 'hidden')}
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 70%, rgba(255,255,255,1) 100%)'
              }}
            />
          </ScrollArea>
        </DndContext>
      ) : (
        <div>MAP</div>
      )}

      {/* edit modal */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className='p-4 sm:max-w-xl'
            onPointerDownOutside={(e) => {
              e.preventDefault();
              setOpen(true);
            }}>
            <DialogTitle className='text-sm font-bold'>編集</DialogTitle>
            <DialogDescription className='hidden' />
            <Input
              value={selectedTodo?.title}
              onChange={(e) =>
                selectedTodo?.title
                  ? setSelectedTodo({ ...selectedTodo, title: e.target.value })
                  : selectedTodo && setSelectedTodo({ ...selectedTodo, title: e.target.value })
              }
              placeholder='タイトル'
              className='selection:bg-main/80 w-full rounded-none border-0 shadow-none ring-0 selection:text-white focus:shadow-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 md:text-2xl'
            />

            <Separator />

            <div className='flex flex-col items-center justify-between'>
              <div className='flex w-full items-center justify-between'>
                <Label>期限</Label>
                <div className='flex items-center gap-2'>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[250px] justify-start text-left font-normal',
                      selectedTodo?.due_date && 'text-muted-foreground'
                    )}
                    onClick={() => toggleAccordion(1)}>
                    <CalendarIcon />
                    {selectedTodo?.due_date ? (
                      format(new Date(selectedTodo.due_date), 'PPP', { locale: ja })
                    ) : (
                      <span>期限を決める</span>
                    )}
                  </Button>
                  <Button
                    variant={'outline'}
                    onClick={() => selectedTodo && setSelectedTodo({ ...selectedTodo, due_date: undefined })}>
                    <RotateCcw size={16} />
                  </Button>
                </div>
              </div>
              <div className='accordion hidden w-full transition-all' id='accordion-1'>
                <Calendar
                  mode='single'
                  selected={selectedTodo?.due_date ? new Date(selectedTodo.due_date) : undefined}
                  onSelect={(date) =>
                    selectedTodo && setSelectedTodo({ ...selectedTodo, due_date: date?.toLocaleDateString('ja-JP') })
                  }
                  locale={ja}
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

            <div className='flex justify-between gap-2'>
              <Label>優先度</Label>
              <div className='flex items-center gap-2'>
                <Select
                  onValueChange={(value) =>
                    selectedTodo &&
                    setSelectedTodo({
                      ...selectedTodo,
                      priority: value as 'low' | 'medium' | 'high'
                    })
                  }>
                  <SelectTrigger className='w-[250px] cursor-pointer'>
                    <div className='flex flex-1'>
                      {selectedTodo?.priority ? (
                        <Badge className='rounded-full' variant={selectedTodo.priority}>
                          {selectedTodo.priority.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>優先度を選択</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className='w-full'>
                    <SelectGroup>
                      <SelectItem value='high'>
                        <Badge className='rounded-full' variant={'high'}>
                          HIGH
                        </Badge>
                      </SelectItem>
                      <SelectItem value='medium'>
                        <Badge className='rounded-full' variant={'medium'}>
                          MEDIUM
                        </Badge>
                      </SelectItem>
                      <SelectItem value='low'>
                        <Badge className='rounded-full' variant={'low'}>
                          LOW
                        </Badge>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant={'outline'}
                  onClick={() => selectedTodo && setSelectedTodo({ ...selectedTodo, priority: 'low' })}>
                  <RotateCcw size={16} />
                </Button>
              </div>
            </div>

            <DialogFooter className=''>
              <DialogClose asChild>
                <Button type='button' variant='secondary'>
                  キャンセル
                </Button>
              </DialogClose>
              <Button
                type='button'
                variant='main'
                disabled={!selectedTodo?.title}
                onClick={() => {
                  setOpen(false);
                  selectedTodo &&
                    updateTodoContent({
                      id: selectedTodo.id,
                      title: selectedTodo.title,
                      due_date: selectedTodo?.due_date
                        ? format(new Date(selectedTodo.due_date), 'yyyy-MM-dd')
                        : undefined,
                      order: selectedTodo.order,
                      priority: selectedTodo.priority
                    });
                }}>
                保存する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className='h-full !max-h-[80dvh]'>
            <DrawerHeader className='p-0'>
              <DrawerTitle className='text-sm font-bold'></DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>

            <div className='grid gap-4 p-4'>
              <Input
                value={selectedTodo?.title}
                onChange={(e) =>
                  selectedTodo?.title
                    ? setSelectedTodo({ ...selectedTodo, title: e.target.value })
                    : selectedTodo && setSelectedTodo({ ...selectedTodo, title: e.target.value })
                }
                placeholder='タイトル'
                className='selection:bg-main/80 w-full rounded-none border-0 text-2xl shadow-none ring-0 selection:text-white focus:shadow-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0'
              />

              <Separator />

              <div className='flex flex-col items-center justify-between'>
                <div className='flex w-full items-center justify-between'>
                  <Label>期限</Label>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[180px] justify-start text-left font-normal',
                        selectedTodo?.due_date && 'text-muted-foreground'
                      )}
                      onClick={() => toggleAccordion(1)}>
                      <CalendarIcon />
                      {selectedTodo?.due_date ? (
                        format(new Date(selectedTodo.due_date), 'PPP', { locale: ja })
                      ) : (
                        <span>期限を決める</span>
                      )}
                    </Button>
                    <Button
                      variant={'outline'}
                      onClick={() => selectedTodo && setSelectedTodo({ ...selectedTodo, due_date: undefined })}>
                      <RotateCcw size={16} />
                    </Button>
                  </div>
                </div>
                <div className='accordion hidden w-full transition-all' id='accordion-1'>
                  <Calendar
                    mode='single'
                    selected={selectedTodo?.due_date ? new Date(selectedTodo.due_date) : undefined}
                    onSelect={(date) =>
                      selectedTodo && setSelectedTodo({ ...selectedTodo, due_date: date?.toLocaleDateString('ja-JP') })
                    }
                    locale={ja}
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

              <div className='flex justify-between gap-2'>
                <Label>優先度</Label>
                <div className='flex items-center gap-2'>
                  <Select
                    onValueChange={(value) =>
                      selectedTodo &&
                      setSelectedTodo({
                        ...selectedTodo,
                        priority: value as 'low' | 'medium' | 'high'
                      })
                    }>
                    <SelectTrigger className='w-[180px] cursor-pointer'>
                      <div className='flex flex-1'>
                        {selectedTodo?.priority ? (
                          <Badge className='rounded-full' variant={selectedTodo.priority}>
                            {selectedTodo.priority.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground'>優先度を選択</span>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className='w-full'>
                      <SelectGroup>
                        <SelectItem value='high'>
                          <Badge className='rounded-full' variant={'high'}>
                            HIGH
                          </Badge>
                        </SelectItem>
                        <SelectItem value='medium'>
                          <Badge className='rounded-full' variant={'medium'}>
                            MEDIUM
                          </Badge>
                        </SelectItem>
                        <SelectItem value='low'>
                          <Badge className='rounded-full' variant={'low'}>
                            LOW
                          </Badge>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={'outline'}
                    onClick={() => selectedTodo && setSelectedTodo({ ...selectedTodo, priority: 'low' })}>
                    <RotateCcw size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <DrawerFooter>
              <Button
                type='button'
                variant='main'
                disabled={!selectedTodo?.title}
                onClick={() => {
                  setOpen(false);
                  selectedTodo &&
                    updateTodoContent({
                      id: selectedTodo.id,
                      title: selectedTodo.title,
                      due_date: selectedTodo?.due_date
                        ? format(new Date(selectedTodo.due_date), 'yyyy-MM-dd')
                        : undefined,
                      order: selectedTodo.order,
                      priority: selectedTodo.priority
                    });
                }}>
                保存する
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
    </div>
  );
}
