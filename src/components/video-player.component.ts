
import { Component, ChangeDetectionStrategy, input, signal, viewChild, ElementRef, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50 group"
      (mouseenter)="showControls()"
      (mouseleave)="hideControls()"
      (mousemove)="showControls()">
      
      <video #videoPlayer
        class="w-full h-full"
        [src]="src()"
        (loadedmetadata)="onLoadedMetadata()"
        (timeupdate)="onTimeUpdate()"
        (play)="isPlaying.set(true)"
        (pause)="isPlaying.set(false)"
        (waiting)="isBuffering.set(true)"
        (playing)="isBuffering.set(false)"
        (click)="togglePlayPause()"
        (dblclick)="toggleFullscreen()"
        [volume]="volume()"
        [muted]="isMuted()">
      </video>

      <!-- Loading Spinner -->
      @if (isBuffering()) {
        <div class="absolute inset-0 flex items-center justify-center bg-black/50">
          <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      }

      <!-- Center Play Button -->
      @if (!isPlaying() && !isBuffering()) {
        <button (click)="togglePlayPause()" class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-100 group-hover:opacity-100 bg-black/30">
          <i class="fas fa-play text-5xl text-white drop-shadow-lg"></i>
        </button>
      }

      <!-- Controls -->
      <div 
        class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300"
        [class.opacity-0]="!isControlsVisible() && isPlaying()"
        [class.opacity-100]="isControlsVisible() || !isPlaying()">

        <!-- Progress Bar -->
        <div class="relative h-1.5 bg-white/20 rounded-full cursor-pointer" (click)="scrub($event)">
          <div class="absolute h-full bg-brand-500 rounded-full" [style.width.%]="progress()"></div>
          <div class="absolute h-3 w-3 -mt-1 bg-white rounded-full" [style.left.%]="progress()"></div>
        </div>
        
        <!-- Bottom Controls -->
        <div class="flex items-center justify-between mt-2 text-white">
          <div class="flex items-center gap-4">
            <button (click)="togglePlayPause()">
              <i class="fas" [class.fa-play]="!isPlaying()" [class.fa-pause]="isPlaying()"></i>
            </button>
            <div class="flex items-center group/volume">
              <button (click)="toggleMute()">
                <i class="fas" [class.fa-volume-up]="!isMuted() && volume() > 0.5" [class.fa-volume-down]="!isMuted() && volume() > 0 && volume() <= 0.5" [class.fa-volume-mute]="isMuted() || volume() === 0"></i>
              </button>
              <input 
                type="range" min="0" max="1" step="0.05" [value]="volume()" 
                (input)="onVolumeChange($event)"
                class="w-0 h-1 ml-2 transition-all duration-300 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 accent-brand-500"
              />
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <span class="text-xs font-mono">{{ formattedTime() }} / {{ formattedDuration() }}</span>
            <button (click)="toggleFullscreen()">
              <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent {
  src = input.required<string>();
  videoPlayerRef = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
  
  isPlaying = signal(false);
  isMuted = signal(false);
  isBuffering = signal(true);
  isControlsVisible = signal(true);
  
  duration = signal(0);
  currentTime = signal(0);
  volume = signal(1);

  private controlsTimeout: any;

  progress = computed(() => this.duration() > 0 ? (this.currentTime() / this.duration()) * 100 : 0);
  formattedTime = computed(() => this.formatTime(this.currentTime()));
  formattedDuration = computed(() => this.formatTime(this.duration()));

  constructor() {
    effect(() => {
      const video = this.videoPlayerRef()?.nativeElement;
      const newSrc = this.src();
      if (video && newSrc) {
        video.src = newSrc;
        video.load();
        video.play().catch(e => console.error("Autoplay was prevented.", e));
        this.isBuffering.set(true);
      }
    });
  }

  onLoadedMetadata() {
    this.duration.set(this.videoPlayerRef().nativeElement.duration);
  }

  onTimeUpdate() {
    this.currentTime.set(this.videoPlayerRef().nativeElement.currentTime);
  }
  
  togglePlayPause(event?: MouseEvent) {
    event?.stopPropagation();
    const video = this.videoPlayerRef().nativeElement;
    video.paused ? video.play() : video.pause();
  }

  toggleMute(event?: MouseEvent) {
    event?.stopPropagation();
    const video = this.videoPlayerRef().nativeElement;
    video.muted = !video.muted;
    this.isMuted.set(video.muted);
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      this.volume.set(0.5);
    }
  }

  onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    const video = this.videoPlayerRef().nativeElement;
    video.volume = newVolume;
    video.muted = newVolume === 0;
    this.isMuted.set(video.muted);
    this.volume.set(newVolume);
  }

  scrub(event: MouseEvent) {
    const scrubbable = event.currentTarget as HTMLElement;
    const rect = scrubbable.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.videoPlayerRef().nativeElement.currentTime = percent * this.duration();
  }

  toggleFullscreen(event?: MouseEvent) {
    event?.stopPropagation();
    const video = this.videoPlayerRef().nativeElement;
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  showControls() {
    this.isControlsVisible.set(true);
    clearTimeout(this.controlsTimeout);
    if(this.isPlaying()) {
      this.controlsTimeout = setTimeout(() => this.isControlsVisible.set(false), 3000);
    }
  }

  hideControls() {
    if (this.isPlaying()) {
      this.isControlsVisible.set(false);
    }
  }

  private formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
