'use client';

import React, { useEffect, useState } from 'react';

import { TodoCard } from '@/app/todos/todoCard';
import { Button } from '@/components/shadcn-ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn-ui/card';
import { Checkbox } from '@/components/shadcn-ui/checkbox';
import { Input } from '@/components/shadcn-ui/input';
import { ScrollArea } from '@/components/shadcn-ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { createClient } from '@/utils/supabase/client';

interface Todo {
  id: string;
  title: string;
  order?: number;
  dueDate?: string;
  completed?: boolean;
}

export default function Todos() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const supabase = createClient();

  const handleTabChange = (value: string) => {
    setViewMode(value as 'list' | 'map');
  };

  async function fetchTodos() {
    const { data, error } = await supabase.from('todos').select('*').order('order', { ascending: false });
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
        due_date: new Date().toISOString(),
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

  async function deleteTodo(id: string) {
    const { error } = await supabase.from('todos').delete().match({ id });
    console.log(id);
    if (error) {
      console.error(error);
    } else {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }
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
            <TodoCard key={todo.id} todo={todo} deleteTodo={deleteTodo} updateTodoStatus={updateTodoStatus} />
          ))}
        </ScrollArea>
      ) : (
        <div>MAP</div>
      )}
    </div>
  );
}
