import { createFileRoute } from '@tanstack/react-router'
import { ImageUpload } from '../components/ImageUpload'

export const Route = createFileRoute('/image')({
  component: ImageComponent,
})

function ImageComponent() {
  return <ImageUpload />
}
