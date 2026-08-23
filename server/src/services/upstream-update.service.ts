import { Injectable } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import { UpstreamReleaseItemDto, UpstreamUpdatesResponseDto } from 'src/dtos/upstream-update.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';

@Injectable()
export class UpstreamUpdateService {
  private cache: { data: UpstreamUpdatesResponseDto; expiresAt: number } | null = null;

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(UpstreamUpdateService.name);
  }

  private translateHighlightsToRussian(body: string, name: string): string {
    if (!body || body.trim().length === 0) {
      return 'Релиз ' + name + ' без подробного описания.';
    }

    const lines = body.split('\n');
    const highlights: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('<!--') || trimmed.startsWith('[') || trimmed.startsWith('http')) {
        continue;
      }

      // Feature / Fix bullets
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        let text = trimmed.replace(/^[\*\-]\s*/, '');
        // Clean markdown links [text](url) -> text
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        // Clean (#123) PR links
        text = text.replace(/\(#\d+\)/g, '');

        if (text.toLowerCase().includes('fix') || text.toLowerCase().includes('исправлен')) {
          highlights.push('Исправление: ' + text.replace(/^(fix|bugfix|fixes):?\s*/i, ''));
        } else if (text.toLowerCase().includes('feat') || text.toLowerCase().includes('добавлен')) {
          highlights.push('Новинка: ' + text.replace(/^(feat|feature|add):?\s*/i, ''));
        } else if (text.toLowerCase().includes('perf') || text.toLowerCase().includes('оптимизац')) {
          highlights.push('Оптимизация: ' + text.replace(/^(perf|performance):?\s*/i, ''));
        } else if (highlights.length < 5) {
          highlights.push(text);
        }
      }

      if (highlights.length >= 8) {
        break;
      }
    }

    if (highlights.length === 0) {
      return body.slice(0, 300) + '...';
    }

    return highlights.join('\n');
  }

  private async fetchRepoReleases(repo: string, source: 'immich' | 'noodle-gallery'): Promise<UpstreamReleaseItemDto[]> {
    try {
      const url = `https://api.github.com/repos/${repo}/releases?per_page=6`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HomePhotoAlbum-Server',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`GitHub API ${repo} responded with ${response.status}`);
        return [];
      }

      const json = (await response.json()) as any[];
      if (!Array.isArray(json)) {
        return [];
      }

      const currentVerStr = serverVersion.toString();

      return json.map((rel) => {
        const tag = (rel.tag_name || '').replace(/^v/, '');
        return {
          id: String(rel.id || rel.tag_name),
          source,
          tagName: rel.tag_name || '',
          name: rel.name || rel.tag_name || 'Релиз',
          publishedAt: rel.published_at || rel.created_at || new Date().toISOString(),
          htmlUrl: rel.html_url || `https://github.com/${repo}/releases/tag/${rel.tag_name}`,
          body: rel.body || '',
          summaryRu: this.translateHighlightsToRussian(rel.body || '', rel.name || rel.tag_name || ''),
          isCurrent: currentVerStr.startsWith(tag) || tag === '2.7.5',
        };
      });
    } catch (err) {
      this.logger.error(`Error fetching releases for ${repo}: ${err}`);
      return [];
    }
  }

  async getUpstreamUpdates(forceRefresh = false): Promise<UpstreamUpdatesResponseDto> {
    const now = Date.now();
    if (!forceRefresh && this.cache && this.cache.expiresAt > now) {
      return this.cache.data;
    }

    const [immichReleases, noodleReleases] = await Promise.all([
      this.fetchRepoReleases('immich-app/immich', 'immich'),
      this.fetchRepoReleases('open-noodle/gallery', 'noodle-gallery'),
    ]);

    const result: UpstreamUpdatesResponseDto = {
      currentVersion: serverVersion.toString() + '-album.1',
      checkedAt: new Date().toISOString(),
      immich: immichReleases,
      noodleGallery: noodleReleases,
    };

    // Cache for 10 minutes
    this.cache = {
      data: result,
      expiresAt: now + 10 * 60 * 1000,
    };

    return result;
  }
}
