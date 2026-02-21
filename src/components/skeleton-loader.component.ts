
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `
    <div class="animate-pulse">
      @if (type() === 'grid') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (item of [1,2,3,4,5,6,7,8]; track item) {
            <div class="rounded-2xl h-80 bg-gray-800/50"></div>
          }
        </div>
      } @else if (type() === 'list') {
        <div class="space-y-4">
          @for (item of [1,2,3,4,5,6]; track item) {
            <div class="rounded-xl h-20 bg-gray-800/50"></div>
          }
        </div>
      } @else if (type() === 'player') {
         <div class="lg:grid lg:grid-cols-3 lg:gap-8">
            <div class="lg:col-span-2">
              <div class="aspect-video bg-gray-800/50 rounded-2xl"></div>
              <div class="h-24 bg-gray-800/50 mt-4 rounded-xl"></div>
            </div>
            <div class="lg:col-span-1 mt-6 lg:mt-0">
               <div class="space-y-4">
                @for (item of [1,2,3,4,5,6]; track item) {
                    <div class="rounded-xl h-24 bg-gray-800/50"></div>
                }
               </div>
            </div>
         </div>
      }
    </div>
  `
})
export class SkeletonLoaderComponent {
  type = input.required<'grid' | 'list' | 'player'>();
}
