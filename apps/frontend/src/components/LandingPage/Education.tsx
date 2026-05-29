// import selfSampleVideo from '@/assets/images/ZeroCancer_Video_ewxn02.webm'
// import cervicalVideo from '@/assets/images/Zerocancer_video_rchsqf.webm'
import { PlayIcon } from 'lucide-react'
import { useState } from 'react'

export default function Education() {
  const [currentVideo, setCurrentVideo] = useState(
    '/Mobilab HPV Testing Video.mp4',
  )

  const videoData = [
    {
      id: 'mobilab-hpv-test',
      src: '/Mobilab HPV Testing Video.mp4',
      title: 'How to Test for HPV Using Mobilab Rapid Test Kit',
      description:
        'Learn how to use the Mobilab rapid test kit for HPV screening.',
    },
  ]

  return (
    <div className="wrapper py-20 flex flex-col lg:flex-row items-center gap-12">
      <div className="lg:w-1/2">
        <h2 className="text-5xl font-bold">Your Cancer Education Toolkit</h2>
        <p className="text-muted-foreground mt-4">
          Short, helpful videos to guide you through understanding, testing, and
          taking control of your health.
        </p>
        <h3 className="text-xl font-bold mt-8">Videos</h3>
        <div className="mt-4 space-y-4">
          {videoData.map((video) => (
            <div
              key={video.id}
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                currentVideo === video.src
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent'
              }`}
              onClick={() => setCurrentVideo(video.src)}
            >
              <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                <video src={video.src} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold">{video.title}</h4>
                <p className="text-muted-foreground text-sm">
                  {video.description}
                </p>
              </div>
              <button
                className="ml-auto bg-secondary text-white p-2 rounded-full flex items-center justify-center flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentVideo(video.src)
                }}
              >
                <PlayIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        <video
          key={currentVideo}
          src={currentVideo}
          controls
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
