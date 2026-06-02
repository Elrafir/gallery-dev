<script lang="ts">
  import Portal from '$lib/elements/Portal.svelte';
  import { fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    description?: string;
    children?: Snippet<[any]>;
    child?: Snippet<[any]>;
    class?: string;
  }

  let { name, description, children, child, class: className = 'inline-block' }: Props = $props();

  let visible = $state(false);
  let x = $state(0);
  let y = $state(0);
  let triggerEl = $state<HTMLElement | null>(null);
  let tooltipEl = $state<HTMLElement | null>(null);
  let timeoutId: NodeJS.Timeout | null = null;
  let hideTimeoutId: NodeJS.Timeout | null = null;

  const showTooltip = () => {
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
      hideTimeoutId = null;
    }
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      const sidebar = document.getElementById('sidebar');
      const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : 0;
      
      const width = 256; // max-width of tooltip
      
      // Calculate horizontal center
      let targetX = rect.left + rect.width / 2 - width / 2;
      // Constraint left boundary (sidebar + safety margin)
      if (targetX < sidebarRight + 12) {
        targetX = sidebarRight + 12;
      }
      // Constraint right boundary
      if (targetX + width > window.innerWidth - 12) {
        targetX = window.innerWidth - width - 12;
      }
      
      // Initial guess for Y (below the element if we don't know the height yet)
      let targetY = rect.bottom + 8;
      
      x = targetX;
      y = targetY;
      visible = true;
    }, 700);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    hideTimeoutId = setTimeout(() => {
      visible = false;
    }, 150);
  };

  $effect(() => {
    if (visible && tooltipEl && triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      const height = tooltipEl.offsetHeight;
      let fixedY = rect.top - height - 8;
      if (fixedY < 12) {
        // Not enough space above, place below
        fixedY = rect.bottom + 8;
      }
      y = fixedY;
    }
  });
</script>

<div
  bind:this={triggerEl}
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  class={className}
>
  {#if child}
    {@render child({})}
  {:else if children}
    {@render children({})}
  {/if}
</div>

{#if visible && name}
  <Portal target="body">
    <div
      bind:this={tooltipEl}
      style="position: fixed; left: {x}px; top: {y}px; z-index: 9999;"
      class="w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 text-left pointer-events-none"
      transition:fade={{ duration: 150 }}
    >
      <h4 class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">
        {name}
      </h4>
      {#if description}
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <span class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
            Описание
          </span>
          <p class="text-xs text-gray-600 dark:text-zinc-400 line-clamp-4 italic whitespace-pre-line leading-relaxed">
            {description}
          </p>
        </div>
      {/if}
    </div>
  </Portal>
{/if}

