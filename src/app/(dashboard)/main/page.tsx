import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { auth } from '@root/auth'
import { getQuarterlyCheckDataAction, QuarterlyCheckWebResult } from '@/app/actions/get-quarterly-check'

async function fetchGeneralVATSIMData(url: string, revalidateSeconds: number = 300) {
  try {
    const response = await fetch(url, { next: { revalidate: revalidateSeconds } });
    if (!response.ok) {
      console.error(`Error fetching ${url}: ${response.status} ${response.statusText}`);
      // Kembalikan struktur default yang aman
      if (url.includes("/stats")) return { atc: 0, pilot: 0 };
      if (url.includes("/atc?limit=1")) return { count: 0, items: [{ connection_id: { callsign: "N/A" } }] };
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Network error fetching ${url}:`, error);
    if (url.includes("/stats")) return { atc: 0, pilot: 0 };
    if (url.includes("/atc?limit=1")) return { count: 0, items: [{ connection_id: { callsign: "N/A" } }] };
    return null;
  }
}

const page = async () => {
  const session = await auth()
  const userIdForApi = process.env.NODE_ENV === 'development' ? "1708238" : session?.user?.cid;

  const statsUrl = `https://api.vatsim.net/v2/members/${userIdForApi}/stats`;
  const atcUrl = `https://api.vatsim.net/v2/members/${userIdForApi}/atc?limit=1`;

  const [onlineHoursData, lastATCOnlineData] = await Promise.all([
    fetchGeneralVATSIMData(statsUrl, 300),
    fetchGeneralVATSIMData(atcUrl, 300)
  ]);

  const onlineHours = onlineHoursData?.atc ?? 'N/A';
  const lastCallsign = lastATCOnlineData?.items?.[0]?.connection_id?.callsign ?? 'N/A';
  const quarterlyData: QuarterlyCheckWebResult = await getQuarterlyCheckDataAction();

  return (
    <>
      <h1 className='text-3xl font-bold'>Welcome Aboard, {session?.user?.name}!</h1>
      <div className='flex flex-wrap gap-5 justify-start items-center mt-5'>
        <Card className='w-96'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Rating</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{session?.user.ratingShort} - ({session?.user?.ratingLong})</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Online Hours</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{onlineHours} hours</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Last Online</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              <p className='text-2xl font-thin'>{lastCallsign}</p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className='w-80'>
          <CardHeader className='flex flex-col items-start justify-start'>
            <CardTitle className='text-2xl font-bold'>Quarterly Status</CardTitle>
            <Separator className='w-full my-2' />
            <CardContent>
              {quarterlyData.error ? (
                <p className="text-red-500 font-medium">{quarterlyData.error}</p>
              ) : (
                <p className={`font-semibold text-2xl ${quarterlyData.isRequirementMet ? 'text-green-600' : 'text-red-600'}`}>
                  {quarterlyData.isRequirementMet ? '✅ Available!' : '❌ Not Available'}<br />
                </p>
              )}
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