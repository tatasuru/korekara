'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/shadcn-ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn-ui/card';
import { Input } from '@/components/shadcn-ui/input';
import { ScrollArea } from '@/components/shadcn-ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';

interface Todo {
  id: string;
  title: string;
}

export default function Todos() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleTabChange = (value: string) => {
    setViewMode(value as 'list' | 'map');
  };

  function addTodo(title: string) {
    setTodos((prev) => [...prev, { id: Math.random().toString(), title }]);
    setInputValue('');
  }

  return (
    <div className='grid h-full grid-rows-[auto_auto_1fr] gap-4 md:flex md:grid-cols-2 md:flex-col'>
      <div className='flex w-full items-center gap-2 md:w-1/2'>
        <Input
          type='text'
          placeholder='やることを入力...'
          className='w-full md:min-w-96'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Button
          type='button'
          className='cursor-pointer bg-[#ebbe4d] md:w-20'
          onClick={() => addTodo(inputValue)}
          disabled={!inputValue}>
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
        <ScrollArea className='grid h-[calc(100svh-210px)] w-full md:h-[calc(100svh-160px)] md:w-1/2'>
          {todos.map((todo) => (
            <Card
              key={todo.id}
              className='mb-2 cursor-pointer rounded-md py-3 shadow-none last:mb-0'
              onClick={() => {
                console.log(todo.id);
              }}>
              <CardHeader>
                <CardTitle>{todo.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </ScrollArea>
      ) : (
        <div>MAP</div>
      )}
    </div>
  );
}
