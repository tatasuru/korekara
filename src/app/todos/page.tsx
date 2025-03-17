'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/shadcn-ui/button';
import { Input } from '@/components/shadcn-ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';

export default function Todos() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [todos, setTodos] = useState([]);

  const handleTabChange = (value: string) => {
    setViewMode(value as 'list' | 'map');
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex w-full items-center gap-2'>
        <Input type='text' placeholder='やることを入力...' className='w-full md:w-1/2 md:min-w-96' />
        <Button type='button' className='cursor-pointer bg-[#ebbe4d] md:w-20'>
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
      <div>{viewMode === 'list' ? <div></div> : <div>MAP</div>}</div>
    </div>
  );
}
