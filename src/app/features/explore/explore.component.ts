import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExploreMode, GeographyEntity } from '../../core/models/geography.models';
import { GeographySearchService } from '../../core/services/geography-search.service';
import { GeographySelectionService } from '../../core/services/geography-selection.service';
import { GeographyInfoCardComponent } from '../../shared/components/geography-info-card/geography-info-card.component';
import { GeographyMapComponent } from '../../shared/components/geography-map/geography-map.component';
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
  readonly query = signal('');
  readonly results = computed(() => this.searchService.search(this.query()));
  readonly dark = signal(false);
  readonly modes: { id: ExploreMode; label: string }[] = [
    { id: 'world', label: 'World' },
    { id: 'continents', label: 'Continents' },
    { id: 'oceans', label: 'Oceans' },
    { id: 'india', label: 'India' },
  ];
  setMode(mode: ExploreMode): void {
    this.mode.set(mode);
    if (mode === 'india')
      this.selection.select({ id: 'country-IND', name: 'India', type: 'country' });
  }
  choose(entity: GeographyEntity): void {
    this.selection.select(entity);
    this.query.set('');
    if (entity.type === 'india-state' || entity.type === 'india-union-territory')
      this.mode.set('india');
    else if (entity.type === 'ocean') this.mode.set('oceans');
    else if (entity.type === 'continent') this.mode.set('continents');
    else this.mode.set('world');
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
