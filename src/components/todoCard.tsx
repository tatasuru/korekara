'use client';

import React from 'react';

import { Badge } from '@/components/shadcn-ui/badge';
import { Button } from '@/components/shadcn-ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn-ui/card';
import { Checkbox } from '@/components/shadcn-ui/checkbox';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Edit, GripVertical, Trash } from 'lucide-react';

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
    id: todo.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <Card className='gap-1 rounded-md py-3 shadow-none last:mb-0' ref={setNodeRef} style={style}>
      <CardHeader className='flex items-center justify-between gap-2 px-4 md:px-6'>
        <div className='flex w-4/5 items-center gap-2'>
          <Button
            variant={'ghost'}
            size={'xs'}
            type='button'
            ref={setActivatorNodeRef}
            className={cn(isDragging ? 'cursor-grabbing' : 'cursor-grab')}
            {...attributes}
            {...listeners}>
            <GripVertical className='text-muted-foreground' />
          </Button>
          <Checkbox
            className='data-[state=checked]:bg-main dark:data-[state=checked]:bg-main data-[state=checked]:border-main cursor-pointer data-[state=checked]:text-white'
            checked={todo.completed}
            onCheckedChange={() => updateTodoStatus(todo.id, !todo.completed)}
          />
          <CardTitle
            className={cn(
              'truncate text-sm',
              todo.completed ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
            )}>
            {todo.title}
          </CardTitle>
        </div>
        <div className='flex gap-1'>
          <Button
            type='button'
            size={'xs'}
            variant={'ghost'}
            className={cn('cursor-pointer', isDesktop ? 'size-6' : 'size-6')}
            onClick={() => editTodo(todo.id)}>
            <Edit size={8} />
          </Button>
          <Button
            size={'xs'}
            variant={'ghost'}
            className={cn('cursor-pointer', isDesktop ? 'size-6' : 'size-6')}
            onClick={() => deleteTodo(todo.id)}>
            <Trash size={8} className='text-destructive' />
          </Button>
        </div>
      </CardHeader>
      <CardFooter className='items-center gap-2 pr-4 pl-10 md:pr-6 md:pl-20'>
        <Badge className='rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant={todo.priority}>
          {todo.priority?.toLocaleUpperCase()}
        </Badge>
        <CardDescription>期限：{todo.due_date ? todo.due_date.replace(/-/g, '/') : 'なし'}</CardDescription>
      </CardFooter>
    </Card>
  );
}
