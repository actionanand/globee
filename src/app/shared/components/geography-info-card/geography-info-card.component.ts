import { Component, input } from '@angular/core';
import { GeographyEntity } from '../../../core/models/geography.models';
@Component({
  selector: 'app-geography-info-card',
  templateUrl: './geography-info-card.component.html',
  styleUrl: './geography-info-card.component.scss',
})
export class GeographyInfoCardComponent {
  readonly entity = input<GeographyEntity | null>(null);
  readonly label = (type: string) => type.replaceAll('-', ' ');
}
