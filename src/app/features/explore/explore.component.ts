import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExploreMode, GeographyEntity } from '../../core/models/geography.models';
import { GeographySearchService } from '../../core/services/geography-search.service';
import { GeographySelectionService } from '../../core/services/geography-selection.service';
import { GeographyInfoCardComponent } from '../../shared/components/geography-info-card/geography-info-card.component';
import { GeographyMapComponent } from '../../shared/components/geography-map/geography-map.component';
import { entityMapMode } from '../../shared/utils/geography.utils';
import { nextScene } from './explore-scene.utils';
@Component({
  selector: 'app-explore',
  imports: [NgOptimizedImage, RouterLink, GeographyMapComponent, GeographyInfoCardComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent {
  private readonly searchService = inject(GeographySearchService);
  readonly selection = inject(GeographySelectionService);
  readonly mode = signal<ExploreMode>('world');
  readonly sceneRevision = signal(0);
  readonly query = signal('');
  readonly results = computed(() => this.searchService.search(this.query()));
  readonly mapHelp = computed(() => {
    switch (this.mode()) {
      case 'continents':
        return 'Explore the countries that make up each continent.';
      case 'oceans':
        return 'Choose an ocean to explore its part of the world.';
      case 'india':
        return 'Select a state or Union Territory to learn more.';
      default:
        return 'Select a country to learn more.';
    }
  });
  readonly dark = signal(false);
  readonly pickerPreview = signal<GeographyEntity | null>(null);
  readonly modes: { id: ExploreMode; label: string }[] = [
    { id: 'world', label: 'World' },
    { id: 'continents', label: 'Continents' },
    { id: 'oceans', label: 'Oceans' },
    { id: 'india', label: 'India' },
  ];
  setMode(mode: ExploreMode): void {
    const next = nextScene(this.mode(), mode, this.sceneRevision());
    this.selection.clear();
    this.pickerPreview.set(null);
    this.mode.set(next.mode);
    this.sceneRevision.set(next.revision);
  }
  resetScene(): void {
    this.selection.clear();
    this.pickerPreview.set(null);
    this.sceneRevision.update((revision) => revision + 1);
  }
  choose(entity: GeographyEntity): void {
    this.query.set('');
    const mode = entityMapMode(entity);
    if (this.mode() !== mode) this.mode.set(mode);
    this.selection.select(entity);
  }
  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  toggleTheme(): void {
    this.dark.update((dark) => !dark);
    document.documentElement.classList.toggle('dark', this.dark());
  }
  typeLabel(type: string): string {
    return type.replaceAll('-', ' ');
  }
}
