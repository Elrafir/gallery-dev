import { ApiProperty } from '@nestjs/swagger';

export class UpstreamReleaseItemDto {
  @ApiProperty({ example: 'v2.7.5' })
  id!: string;

  @ApiProperty({ enum: ['immich', 'noodle-gallery'] })
  source!: 'immich' | 'noodle-gallery';

  @ApiProperty({ example: 'v2.7.5' })
  tagName!: string;

  @ApiProperty({ example: 'Immich v2.7.5 Release' })
  name!: string;

  @ApiProperty({ example: '2026-05-30T16:00:00Z' })
  publishedAt!: string;

  @ApiProperty({ example: 'https://github.com/immich-app/immich/releases/tag/v2.7.5' })
  htmlUrl!: string;

  @ApiProperty({ description: 'Original release notes in English' })
  body!: string;

  @ApiProperty({ description: 'Key highlights / summary in Russian' })
  summaryRu!: string;

  @ApiProperty({ example: false })
  isCurrent!: boolean;
}

export class UpstreamUpdatesResponseDto {
  @ApiProperty({ example: '2.7.5-album.1' })
  currentVersion!: string;

  @ApiProperty({ example: '2026-08-23T12:00:00Z' })
  checkedAt!: string;

  @ApiProperty({ type: [UpstreamReleaseItemDto] })
  immich!: UpstreamReleaseItemDto[];

  @ApiProperty({ type: [UpstreamReleaseItemDto] })
  noodleGallery!: UpstreamReleaseItemDto[];
}
