import { createRouteHandlers } from '@/lib/routeHandlerFactory'
import { connectToDatabase } from '@/lib/mongodb'
import { NextRequest } from 'next/server'
import { modelConfigs } from '../../modelConfigs'

connectToDatabase()
type ModelConfigKey = keyof typeof modelConfigs;

const getHandlers = async (slug: string) => {
  const modelConfig = modelConfigs[slug as ModelConfigKey]

  if (!modelConfig) {
    throw new Error(`Invalid model slug: ${slug}`)
  }

  return createRouteHandlers(modelConfig)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const handlers = await getHandlers(slug)

  // Check if it's an export request
  const { searchParams } = new URL(request.url)
  if (searchParams.get('action') === 'export') {
    return handlers.export(request)
  }

  return handlers.getAll(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const handlers = await getHandlers(slug)
  const { searchParams } = new URL(request.url)
  if (searchParams.get('action') === 'import') {
    return handlers.import(request)
  }
  else if (searchParams.get('action') === 'bulk-update') {
    return handlers.bulkUpdate(request)
  }
  else if (searchParams.get('action') === 'bulk-delete') {
    return handlers.bulkDelete(request)
  }
  return handlers.create(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const handlers = await getHandlers(slug)
  return handlers.update(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const handlers = await getHandlers(slug)
  return handlers.delete(request)
} 