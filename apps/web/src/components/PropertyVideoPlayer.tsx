'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface PropertyVideo {
  id: string;
  url: string;
  title?: string;
  type: 'UPLOADED' | 'YOUTUBE' | 'VIMEO';
}

interface PropertyVideoPlayerProps {
  videos: PropertyVideo[];
}

export function PropertyVideoPlayer({ videos }: PropertyVideoPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<PropertyVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No videos available</p>
      </div>
    );
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\&\?\/\r\n]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  };

  const renderVideoEmbed = (video: PropertyVideo) => {
    switch (video.type) {
      case 'YOUTUBE': {
        const embedUrl = getYouTubeEmbedUrl(video.url);
        if (!embedUrl) return null;
        return (
          <iframe
            width="100%"
            height="600"
            src={embedUrl}
            title={video.title || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        );
      }
      case 'VIMEO': {
        const embedUrl = getVimeoEmbedUrl(video.url);
        if (!embedUrl) return null;
        return (
          <iframe
            width="100%"
            height="600"
            src={embedUrl}
            title={video.title || 'Vimeo video'}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        );
      }
      case 'UPLOADED':
      default:
        return (
          <video
            width="100%"
            height="600"
            controls
            className="rounded-lg bg-black"
            controlsList="nodownload"
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(video => (
          <button
            key={video.id}
            onClick={() => {
              setSelectedVideo(video);
              setIsPlaying(true);
            }}
            className="relative group rounded-lg overflow-hidden bg-gray-900 aspect-video cursor-pointer transition-transform hover:scale-105"
          >
            {/* Video Type Badge */}
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
              {video.type}
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
              <div className="bg-white rounded-full p-3 group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-gray-900 fill-gray-900" />
              </div>
            </div>

            {/* Title */}
            {video.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{video.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && isPlaying && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedVideo(null);
            }}
            className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            aria-label="Close video player"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>

          {/* Video Container */}
          <div className="w-full max-w-4xl">
            {renderVideoEmbed(selectedVideo)}

            {/* Title and Info */}
            {selectedVideo.title && (
              <div className="mt-4 text-white">
                <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                <p className="text-sm text-gray-400 mt-1">Type: {selectedVideo.type}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
