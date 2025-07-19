import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma';
import React from 'react'
import Image from 'next/image'
import { CalendarIcon, ClockIcon, Link } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const page = async () => {
  const publishedEvents = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      startDateTime: 'asc', // Show upcoming events first
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground">
          Join us for our upcoming events. See details below.
        </p>
      </div>

      {publishedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedEvents.map((event) => (
            <Card key={event.id} className="flex flex-col overflow-hidden">
              <CardHeader className="p-0 relative h-48 w-full">
                {event.bannerImageUrl ? (
                  <Image
                    src={event.bannerImageUrl}
                    alt={`${event.name} banner`}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="bg-muted h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">No Image</p>
                  </div>
                )}
              </CardHeader>
              <div className="flex flex-col flex-grow p-6">
                <CardTitle className="mb-2">{event.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mb-4 gap-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(new Date(event.startDateTime), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4" />
                    <span>{format(new Date(event.startDateTime), 'HH:mm')} WIB</span>
                  </div>
                </div>
                <CardDescription className="flex-grow line-clamp-3">
                  {event.description}
                </CardDescription>
                <CardFooter className="p-0 pt-4 mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12 mt-8">
          <h2 className="text-xl font-semibold">No Events Scheduled</h2>
          <p className="mt-2 text-muted-foreground">
            There are no upcoming events at the moment. Please check back later!
          </p>
        </div>
      )}
    </div>
  )
}
export default page
