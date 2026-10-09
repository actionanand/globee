import { Component, inject, input, output } from '@angular/core';
import { ExploreMode, GeographyEntity } from '../../../core/models/geography.models';
import { CONTINENTS, OCEANS } from '../../../core/services/geography-search.service';
import { GeographySelectionService } from '../../../core/services/geography-selection.service';
@Component({
  selector: 'app-geography-info-card',
  templateUrl: './geography-info-card.component.html',
  styleUrl: './geography-info-card.component.scss',
})
export class GeographyInfoCardComponent {
  readonly entity = input<GeographyEntity | null>(null);
  readonly mode = input.required<ExploreMode>();
  readonly oceans = OCEANS;
  readonly continents = CONTINENTS;
  readonly pickerPreview = output<GeographyEntity | null>();
  private readonly selection = inject(GeographySelectionService);
  readonly label = (type: string) => type.replaceAll('-', ' ');
  selectOcean(ocean: (typeof OCEANS)[number]): void {
    this.selection.select(this.oceanEntity(ocean));
  }
  previewOcean(ocean: (typeof OCEANS)[number]): void {
    this.pickerPreview.emit(this.oceanEntity(ocean));
  }
  selectContinent(continent: (typeof CONTINENTS)[number]): void {
    this.selection.select(this.continentEntity(continent));
  }
  previewContinent(continent: (typeof CONTINENTS)[number]): void {
    this.pickerPreview.emit(this.continentEntity(continent));
  }
  private oceanEntity(ocean: (typeof OCEANS)[number]): GeographyEntity {
    return {
      id: `ocean-${ocean.id}`,
      name: ocean.name,
      type: 'ocean',
      ocean,
      description: ocean.description,
    };
  }
  private continentEntity(continent: (typeof CONTINENTS)[number]): GeographyEntity {
    return {
      id: `continent-${continent.id}`,
      name: continent.name,
      type: 'continent',
      continent,
    };
  }
}
