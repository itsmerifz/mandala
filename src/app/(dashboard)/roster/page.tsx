import type { Roster } from '@/app/types'
import RosterTable from '@/components/roster-table'
import { Card } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

const getCombinedRosterData = async (): Promise<Roster[]> => {
  const users = await prisma.user.findMany({
    include: {
      userCertificates: {
        include: {
          certificate: true
        }
      }
    }
  })

  return users.map(user => ({
    id: user.id,
    cid: user.cid,
    name: user.name,
    rating: user.ratingShort,
    certificates: user.userCertificates.map(cert => ({
      id: cert.id,
      code: cert.certificate.code,
      color: cert.certificate.color,
      isOnTraining: cert.isOnTraining,
      notes: cert.notes ?? undefined,
      issuedAt: cert.issuedAt,
      upgradedAt: cert.upgradedAt ?? undefined
    }))
  }))
}

const Roster = async () => {
  const data = await getCombinedRosterData()

  return (
    <>
      <h1 className='text-3xl font-bold'>Roster List</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5'>
        <RosterTable data={data} />
      </Card>
    </>
  )
}

export default Roster