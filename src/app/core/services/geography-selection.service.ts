import { Injectable, signal } from '@angular/core';
import { GeographyEntity } from '../models/geography.models';
@Injectable({ providedIn: 'root' })
export class GeographySelectionService {
  readonly selected = signal<GeographyEntity | null>(null);
  select(entity: GeographyEntity): void {
    this.selected.set(entity);
  }
  clear(): void {
    this.selected.set(null);
  }
}
