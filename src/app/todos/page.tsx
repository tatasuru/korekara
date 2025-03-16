import { Button } from '@/components/shadcn-ui/button';
import { Input } from '@/components/shadcn-ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';

export default function Todos() {
  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-2xl font-bold'>TODO</h1>
      <div className='flex w-full items-center gap-2'>
        <Input type='text' placeholder='やることを入力...' className='w-full md:w-1/2 md:min-w-96' />
        <Button type='button' className='cursor-pointer bg-[#ebbe4d] md:w-20'>
          追加
        </Button>
      </div>
      <Tabs defaultValue='list' className='md:w-[200px]'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='list' className='cursor-pointer'>
            リスト表示
          </TabsTrigger>
          <TabsTrigger value='map' className='cursor-pointer'>
            マップ表示
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className=''>
        <ul>
          <li></li>
        </ul>
      </div>
    </div>
  );
}
