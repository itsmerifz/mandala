import RosterTable from '@/components/roster-table'
import { Card } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

const Roster = async () => {
  const rosterData = await prisma.user.findMany()
  const roster = rosterData.map((user) => {
    return {
      cid: user.cid,
      name: user.name,
      rating: user.ratingShort,
      certificate: null
    }
  })

  return (
    <>
      <h1 className='text-3xl font-bold'>Roster List</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5'>
        <RosterTable data={roster} />
      </Card>
    </>
  )
}

export default Roster