import { TutorChat } from '@/features/tutor/components/TutorChat'

interface Props {
  searchParams: Promise<{ topic?: string }>
}

export default async function TutorPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col max-w-3xl mx-auto">
      <TutorChat initialTopic={params.topic} />
    </div>
  )
}
