import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { auth } from '@root/auth'
import axios from 'axios'
export const dynamic = 'force-dynamic'

const page = async () => {
  const session = await auth()

  const onlineHours = await axios.get(process.env.NODE_ENV === 'development' ? `https://api.vatsim.net/v2/members/1708238/stats` : `https://api.vatsim.net/v2/members/${session?.user?.cid}/stats`).then(res => res.data);
  const lastATCOnline = await axios.get(process.env.NODE_ENV === 'development' ? `https://api.vatsim.net/v2/members/1708238/atc?limit=1` : `https://api.vatsim.net/v2/members/${session?.user?.cid}/atc?limit=1`).then(res => res.data);

  return (
    <>
      <h1 className='text-3xl font-bold'>Welcome Aboard, {session?.user?.personal.name_full}!</h1>
      <div className='flex flex-wrap gap-5 justify-start items-center mt-5'>
        <Card className='w-96'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Rating</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{session?.user?.vatsim.rating.short} - ({session?.user?.vatsim.rating.long})</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Online Hours</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{onlineHours.atc} hours</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Last Online</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{lastATCOnline.items[0].connection_id.callsign}</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Quarterly Status</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>Available</p>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
      <div className='flex flex-wrap gap-5 justify-start items-center mt-5'>
        <Card className='w-full'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Training Status</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>Solo Training at WAAF_CTR (Until 25-09-2025)</p>
            </CardContent>
          </CardHeader>
        </Card>

      </div>
    </>
  )
}

export default page