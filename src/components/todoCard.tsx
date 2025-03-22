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

import { format } from 'date-fns';
import { Edit, GripVertical, Trash } from 'lucide-react';
import { Clock, Flag } from 'lucide-react';

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
  let todoByToday = false;
  let todoByTomorrow = false;
  let expiredTodo = false;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
    id: todo.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Fix date logic
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to beginning of day

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow

  const dueDate = todo.due_date ? new Date(todo.due_date) : null;

  if (dueDate) {
    dueDate.setHours(0, 0, 0, 0); // Set time to beginning of day for comparison

    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();
    const dueDateTime = dueDate.getTime();

    if (dueDateTime === todayTime) {
      todoByToday = true;
    } else if (dueDateTime === tomorrowTime) {
      todoByTomorrow = true;
    } else if (dueDateTime < todayTime) {
      expiredTodo = true;
    }
  }

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
      <CardFooter className='items-center gap-2 pr-4 pl-12 md:pr-6 md:pl-20'>
        <Badge className='gap-1 rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant={todo.priority}>
          <Flag size={12} />
          {todo.priority?.toLocaleUpperCase()}
        </Badge>
        <CardDescription className='flex items-center gap-2'>
          <div className='flex items-center gap-1'>
            {expiredTodo ? (
              <Badge className='items-center gap-1 rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant='expired'>
                <Clock size={12} />
                期限切れ: {todo.due_date && format(new Date(todo.due_date), 'yyyy/MM/dd')}
              </Badge>
            ) : todoByToday ? (
              <Badge className='items-center gap-1 rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant='today'>
                <Clock size={12} />
                今日: {todo.due_date && format(new Date(todo.due_date), 'yyyy/MM/dd')}
              </Badge>
            ) : todoByTomorrow ? (
              <Badge className='items-center gap-1 rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant='tomorrow'>
                <Clock size={12} />
                明日: {todo.due_date && format(new Date(todo.due_date), 'yyyy/MM/dd')}
              </Badge>
            ) : (
              <Badge className='items-center gap-1 rounded-full px-1.5 py-1.5 text-[10px] leading-1' variant='outline'>
                <Clock size={12} />
                {todo.due_date ? format(new Date(todo.due_date), 'yyyy/MM/dd') : '期限なし'}
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
