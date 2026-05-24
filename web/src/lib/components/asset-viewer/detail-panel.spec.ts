import { getAppleMapsUrl, getGoogleMapsUrl, getOpenStreetMapUrl } from '$lib/utils/exif-utils';
import { renderWithTooltips } from '$tests/helpers';
import { AssetTypeEnum, AssetVisibility, type AssetResponseDto } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/svelte';
import DetailPanel from './detail-panel.svelte';

const { getAllAlbumsMock, getAssetInfoMock } = vi.hoisted(() => ({
  getAllAlbumsMock: vi.fn(),
  getAssetInfoMock: vi.fn(),
}));

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getAllAlbums: getAllAlbumsMock,
    getAssetInfo: getAssetInfoMock,
  };
});

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    authenticated: true,
    user: { id: 'owner-1' },
    isSharedLink: false,
    params: {},
    preferences: {
      tags: { enabled: false },
      ratings: { enabled: false },
    },
  },
}));

vi.mock('$lib/managers/asset-viewer-manager.svelte', () => ({
  assetViewerManager: {
    closeDetailPanel: vi.fn(),
    closeEditFacesPanel: vi.fn(),
    isEditFacesPanelOpen: false,
    isShowAssetPath: false,
    openEditFacesPanel: vi.fn(),
    toggleAssetPath: vi.fn(),
    toggleFaceEditMode: vi.fn(),
  },
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    value: {
      map: true,
      smartSearch: false,
    },
  },
}));

vi.mock('$lib/components/shared-components/map/map.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/map-component.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-date.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-description.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-location.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-star-rating.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-tags.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/faces-page/person-side-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/user-avatar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/album-list-item-details.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/LoadingSpinner.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

describe('DetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllAlbumsMock.mockResolvedValue([]);
    getAssetInfoMock.mockResolvedValue(undefined);
  });

  const makeAssetWithSpacePeople = (people: NonNullable<AssetResponseDto['people']>): AssetResponseDto => ({
    id: 'asset-1',
    ownerId: 'owner-1',
    libraryId: 'library-1',
    type: AssetTypeEnum.Image,
    originalPath: '/library/asset-1.jpg',
    originalFileName: 'asset-1.jpg',
    originalMimeType: 'image/jpeg',
    thumbhash: 'thumbhash',
    createdAt: '2026-01-01T00:00:00.000Z',
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    fileModifiedAt: '2026-01-01T00:00:00.000Z',
    localDateTime: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    duration: null,
    checksum: 'checksum',
    isOffline: false,
    hasMetadata: false,
    visibility: AssetVisibility.Timeline,
    width: 1000,
    height: 800,
    isEdited: false,
    people,
    unassignedFaces: [],
  });

  it('uses the shared-space person thumbnail when spacePersonId is present', async () => {
    const asset = makeAssetWithSpacePeople([
      {
        id: 'global-person-1',
        name: 'Alice',
        thumbnailPath: '/ignored.jpg',
        updatedAt: '2026-01-02T00:00:00.000Z',
        isHidden: false,
        birthDate: null,
        type: 'person',
        faces: [
          {
            id: 'face-1',
            imageWidth: 1000,
            imageHeight: 800,
            boundingBoxX1: 100,
            boundingBoxY1: 200,
            boundingBoxX2: 300,
            boundingBoxY2: 400,
          },
        ],
        spacePersonId: 'space-person-1',
      },
    ]);

    const { container } = renderWithTooltips(DetailPanel, {
      asset,
      currentAlbum: null,
      spaceId: 'space-1',
    });

    await waitFor(() =>
      expect(
        container.querySelector('img[src*="/shared-spaces/space-1/people/space-person-1/thumbnail"]'),
      ).toBeTruthy(),
    );
    expect(container.querySelector('img[src^="data:image"]')).toBeNull();
  });

  it('renders shared-space person thumbnails for multiple people on the same asset', async () => {
    const asset = makeAssetWithSpacePeople([
      {
        id: 'global-person-1',
        name: 'Alice',
        thumbnailPath: '/ignored-1.jpg',
        updatedAt: '2026-01-02T00:00:00.000Z',
        isHidden: false,
        birthDate: null,
        type: 'person',
        faces: [
          {
            id: 'face-1',
            imageWidth: 1000,
            imageHeight: 800,
            boundingBoxX1: 100,
            boundingBoxY1: 200,
            boundingBoxX2: 300,
            boundingBoxY2: 400,
          },
        ],
        spacePersonId: 'space-person-1',
      },
      {
        id: 'global-person-2',
        name: 'Bob',
        thumbnailPath: '/ignored-2.jpg',
        updatedAt: '2026-01-03T00:00:00.000Z',
        isHidden: false,
        birthDate: null,
        type: 'person',
        faces: [
          {
            id: 'face-2',
            imageWidth: 1000,
            imageHeight: 800,
            boundingBoxX1: 500,
            boundingBoxY1: 200,
            boundingBoxX2: 700,
            boundingBoxY2: 400,
          },
        ],
        spacePersonId: 'space-person-2',
      },
    ]);

    const { container } = renderWithTooltips(DetailPanel, {
      asset,
      currentAlbum: null,
      spaceId: 'space-1',
    });

    await waitFor(() =>
      expect(
        container.querySelectorAll('img[src*="/shared-spaces/space-1/people/space-person-1/thumbnail"]'),
      ).toHaveLength(1),
    );
    expect(
      container.querySelectorAll('img[src*="/shared-spaces/space-1/people/space-person-2/thumbnail"]'),
    ).toHaveLength(1);
    expect(container.querySelector('img[src^="data:image"]')).toBeNull();
  });

  it('shows people for a shared album viewer who is not the asset owner', async () => {
    const asset = makeAssetWithSpacePeople([
      {
        id: 'person-1',
        name: 'Grandma',
        thumbnailPath: '/people/person-1/thumbnail.jpg',
        updatedAt: '2026-01-02T00:00:00.000Z',
        isHidden: false,
        birthDate: null,
        type: 'person',
        faces: [
          {
            id: 'face-1',
            imageWidth: 1000,
            imageHeight: 800,
            boundingBoxX1: 100,
            boundingBoxY1: 200,
            boundingBoxX2: 300,
            boundingBoxY2: 400,
          },
        ],
      },
    ]);
    asset.ownerId = 'album-owner';

    const { container } = renderWithTooltips(DetailPanel, {
      asset,
      currentAlbum: {
        id: 'album-1',
        ownerId: 'album-owner',
        albumName: 'Family',
        albumUsers: [{ userId: 'viewer-1', role: 'viewer' }],
      } as never,
    });

    await waitFor(() => expect(screen.getByText('people')).toBeInTheDocument());
    expect(screen.getByText('Grandma')).toBeInTheDocument();
    expect(container.querySelector('img[src*="/people/person-1/thumbnail"]')).toBeTruthy();
    expect(screen.queryByLabelText('tag_people')).not.toBeInTheDocument();
  });

  it('renders Google, Apple, and OpenStreetMap links in the image info panel map popup', async () => {
    const lat = 48.853_41;
    const lon = 2.3488;
    const asset = assetFactory.build({
      id: 'asset-with-location',
      ownerId: 'owner-1',
      exifInfo: {
        latitude: lat,
        longitude: lon,
        city: 'Paris',
        country: 'France',
      },
    });

    renderWithTooltips(DetailPanel, { asset });

    await waitFor(() => expect(screen.getByTestId('map-popup')).toBeInTheDocument());

    const googleLink = screen.getByRole('link', { name: 'open_in_google_maps' });
    const appleLink = screen.getByRole('link', { name: 'open_in_apple_maps' });
    const openStreetMapLink = screen.getByRole('link', { name: 'open_in_openstreetmap' });

    expect(googleLink).toHaveAttribute('href', getGoogleMapsUrl(lat, lon));
    expect(appleLink).toHaveAttribute('href', getAppleMapsUrl(lat, lon));
    expect(openStreetMapLink).toHaveAttribute('href', getOpenStreetMapUrl(lat, lon));

    for (const link of [googleLink, appleLink, openStreetMapLink]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
