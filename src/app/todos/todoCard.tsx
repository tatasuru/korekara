'use client';

import React from 'react';

import { Badge } from '@/components/shadcn-ui/badge';
import { Button } from '@/components/shadcn-ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn-ui/card';
import { Checkbox } from '@/components/shadcn-ui/checkbox';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

import { Edit, Trash } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  order?: number;
  due_date?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export function TodoCard({
  todo,
  deleteTodo,
  updateTodoStatus,
  editTodo
}: {
  todo: Todo;
  deleteTodo: (id: string) => void;
  updateTodoStatus: (id: string, completed: boolean) => void;
  editTodo: (id: string) => void;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return (
    <Card key={todo.id} className='mb-2 cursor-pointer gap-1 rounded-md py-3 shadow-none last:mb-0'>
      <CardHeader className='flex items-center justify-between gap-2 px-4 md:px-6'>
        <div className='flex items-center gap-2'>
          <Checkbox
            className='data-[state=checked]:bg-main dark:data-[state=checked]:bg-main data-[state=checked]:border-main cursor-pointer data-[state=checked]:text-white'
            checked={todo.completed}
            onCheckedChange={() => updateTodoStatus(todo.id, !todo.completed)}
          />
          <CardTitle
            className={cn(
              todo.completed ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
            )}>
            {todo.title}
          </CardTitle>
        </div>
        <div className='flex gap-2'>
          <Button
            type='button'
            size={'xs'}
            variant={'outline'}
            className={cn('cursor-pointer', isDesktop ? 'size-6' : 'size-6')}
            onClick={() => editTodo(todo.id)}>
            <Edit size={8} />
          </Button>
          <Button
            size={'xs'}
            variant={'destructive'}
            className={cn('cursor-pointer', isDesktop ? 'size-6' : 'size-6')}
            onClick={() => deleteTodo(todo.id)}>
            <Trash size={8} />
          </Button>
        </div>
      </CardHeader>
      <CardFooter className='gap-2 px-4 md:px-6'>
        <Badge className='rounded-full text-xs' variant={todo.priority}>
          {todo.priority?.toLocaleUpperCase()}
        </Badge>
        <CardDescription>期限：{todo.due_date ? todo.due_date.replace(/-/g, '/') : 'なし'}</CardDescription>
      </CardFooter>
    </Card>
  );
}
