'use client';

import React, { useEffect, useState } from 'react';

import { TodoCard } from '@/app/todos/todoCard';
import { Button } from '@/components/shadcn-ui/button';
import { Calendar } from '@/components/shadcn-ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/shadcn-ui/dialog';
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
import { ScrollArea } from '@/components/shadcn-ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn-ui/select';
import { Separator } from '@/components/shadcn-ui/separator';
import { Switch } from '@/components/shadcn-ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

import { addDays, format, set } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  order?: number;
  due_date?: string;
  completed?: boolean;
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
    const { data, error } = await supabase.from('todos').select('*').order('order', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setTodos(data || []);
      console.log(data);
    }
  }

  async function addTodo() {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: inputValue,
        order: todos.length + 1,
        due_date: null,
        completed: false
      })
      .select('*')
      .order('id', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setTodos([data![0], ...todos]);
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

  async function updateTodoContent(id: string, title: string, due_date?: string) {
    const { error } = await supabase.from('todos').update({ title, due_date }).match({ id });
    if (error) {
      console.error(error);
    } else {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title, due_date } : todo)));
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

  useEffect(() => {
    fetchTodos();
  }, []);

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
          className='cursor-pointer md:w-20'
          disabled={!inputValue}
          onClick={addTodo}>
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
        <ScrollArea className='grid h-[calc(100svh-210px)] w-full md:h-[calc(100svh-160px)] md:max-w-2xl'>
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              deleteTodo={deleteTodo}
              updateTodoStatus={updateTodoStatus}
              editTodo={editTodo}
            />
          ))}
        </ScrollArea>
      ) : (
        <div>MAP</div>
      )}

      {/* edit modal */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='p-4 sm:max-w-md'>
            <DialogTitle className='text-sm font-bold'>編集</DialogTitle>
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

            <div className='flex flex-col gap-2'>
              <Label>期限</Label>
              <Popover>
                <PopoverTrigger asChild className='w-full'>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'justify-start text-left font-normal',
                      selectedTodo?.due_date && 'text-muted-foreground'
                    )}>
                    <CalendarIcon />
                    {selectedTodo?.due_date ? (
                      format(new Date(selectedTodo.due_date), 'PPP', { locale: ja })
                    ) : (
                      <span>Pick a dueDate</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className='flex w-auto flex-col space-y-2 p-2'>
                  <div className='rounded-md border'>
                    <Calendar
                      mode='single'
                      selected={selectedTodo?.due_date ? new Date(selectedTodo.due_date) : undefined}
                      onSelect={(date) =>
                        selectedTodo &&
                        setSelectedTodo({ ...selectedTodo, due_date: date?.toLocaleDateString('ja-JP') })
                      }
                      locale={ja}
                      formatters={{
                        formatCaption: (jaDate) => {
                          const date = new Date(jaDate);
                          return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                        }
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
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
                onClick={() => {
                  setOpen(false);
                  console.log(selectedTodo?.due_date);
                  selectedTodo && updateTodoContent(selectedTodo.id, selectedTodo.title, selectedTodo.due_date);
                }}>
                保存する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className='h-full'>
            <DrawerHeader>
              <DrawerTitle className='text-sm font-bold'>編集</DrawerTitle>
              {/* <DrawerDescription>This action cannot be undone.</DrawerDescription> */}
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

              <div className='flex flex-col gap-2'>
                <Label>期限</Label>
                <Popover>
                  <PopoverTrigger asChild className='w-full'>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'justify-start text-left font-normal',
                        selectedTodo?.due_date && 'text-muted-foreground'
                      )}>
                      <CalendarIcon />
                      {selectedTodo?.due_date ? (
                        format(new Date(selectedTodo.due_date), 'PPP', { locale: ja })
                      ) : (
                        <span>Pick a dueDate</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align='start' className='flex w-auto flex-col space-y-2 p-2'>
                    <div className='rounded-md border'>
                      <Calendar
                        mode='single'
                        selected={selectedTodo?.due_date ? new Date(selectedTodo.due_date) : undefined}
                        onSelect={(date) =>
                          selectedTodo &&
                          setSelectedTodo({ ...selectedTodo, due_date: date?.toLocaleDateString('ja-JP') })
                        }
                        locale={ja}
                        formatters={{
                          formatCaption: (jaDate) => {
                            const date = new Date(jaDate);
                            return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                          }
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DrawerFooter>
              <Button
                type='button'
                variant='main'
                onClick={() => {
                  setOpen(false);
                  console.log(selectedTodo?.due_date);
                  selectedTodo && updateTodoContent(selectedTodo.id, selectedTodo.title, selectedTodo.due_date);
                }}>
                保存する
              </Button>
              <DrawerClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
