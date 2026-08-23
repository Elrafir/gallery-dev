<script lang="ts">
  import { Theme, themeManager } from '@immich/ui';

  type Props = {
    variant?: 'icon' | 'inline' | 'stacked';
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
    transparent?: boolean;
    class?: string;
  };

  const { variant = 'icon', size = 'medium', transparent = false, class: className }: Props = $props();

  const sizeClasses: Record<string, string> = {
    tiny: 'h-8',
    small: 'h-11',
    medium: 'h-14',
    large: 'h-20',
    giant: 'h-28',
  };

  const variantClasses: Record<string, string> = {
    icon: 'object-contain',
    inline: 'object-contain',
    stacked: 'object-contain',
  };

  const src = $derived.by(() => {
    const v = '?v=2.7.5-album.1';
    switch (variant) {
      case 'stacked': {
        return (themeManager.value === Theme.Light ? '/gallery-logo-stacked.svg' : '/gallery-logo-stacked-dark.svg') + v;
      }
      case 'inline': {
        return (themeManager.value === Theme.Light ? '/gallery-logo-inline-light.svg' : '/gallery-logo-inline-dark.svg') + v;
      }
      default: {
        if (transparent) {
          return (themeManager.value === Theme.Light ? '/gallery-loader.svg' : '/gallery-loader-dark.svg') + v;
        }
        return (themeManager.value === Theme.Light ? '/gallery-logo-mark.svg' : '/gallery-logo-mark-dark.svg') + v;
      }
    }
  });

  const classes = $derived([sizeClasses[size], variantClasses[variant], className].filter(Boolean).join(' '));
</script>

<img {src} class={classes} alt="Домашний фотоальбом" />
