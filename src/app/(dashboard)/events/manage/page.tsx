import React from 'react';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { Permission } from '@root/prisma/generated';
import { redirect } from 'next/navigation';
import ManageEventsTable from '@/components/manage-events-table'; // Komponen baru yang akan kita buat

const ManageEventsPage = async () => {
  const session = await auth();
  const userPermissions = session?.user?.appPermissions || [];

  // Proteksi halaman, hanya untuk yang punya permission MANAGE_EVENTS
  if (!userPermissions.includes(Permission.MANAGE_EVENTS) && !userPermissions.includes(Permission.ADMINISTRATOR)) {
    redirect('/main?error=unauthorized');
  }

  // Ambil semua event dari database
  const events = await prisma.event.findMany({
    orderBy: {
      startDateTime: 'desc', // Tampilkan event terbaru di atas
    },
    include: {
      _count: {
        select: { participants: true }, // Hitung jumlah peserta
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage all division events from this page.
        </p>
      </div>

      {/* Kirim data event ke komponen tabel client-side */}
      <ManageEventsTable eventsData={events} />
    </div>
  );
};

export default ManageEventsPage;