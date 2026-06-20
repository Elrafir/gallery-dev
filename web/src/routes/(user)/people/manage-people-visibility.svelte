<script lang="ts">
  import PeopleVisibilityModal from '$lib/components/people/people-visibility-modal.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { updatePeople, updateSpacePerson, type PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    totalPeopleCount: number;
    titleId?: string | undefined;
    onClose: () => void;
    onUpdate: (people: PersonResponseDto[]) => void;
    loadNextPage: () => void;
  }

  let { people, totalPeopleCount, titleId = undefined, onClose, onUpdate, loadNextPage }: Props = $props();

  const visibilityPeople: VisibilityPerson[] = $derived(
    people.map((person) => ({
      id: person.id,
      displayName: person.name,
      thumbnailUrl: getPeopleThumbnailUrl(person),
      isHidden: person.isHidden,
    })),
  );

  const saveVisibilityChanges = async (changes: VisibilityChange[]): Promise<VisibilitySaveResult> => {
    // Разделяем на personal и space changes
    const personalChanges: VisibilityChange[] = [];
    const spaceChanges: { person: PersonResponseDto; isHidden: boolean }[] = [];

    for (const change of changes) {
      const person = people.find((p) => p.id === change.id);
      if (person?.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId) {
        spaceChanges.push({ person, isHidden: change.isHidden });
      } else {
        personalChanges.push(change);
      }
    }

    let successCount = 0;
    let failCount = 0;

    // Personal persons — batch update
    if (personalChanges.length > 0) {
      const results = await updatePeople({ peopleUpdateDto: { people: personalChanges } });
      successCount += results.filter(({ success }) => success).length;
      failCount += results.length - successCount;
    }

    // Space persons — individual smart updates
    for (const { person, isHidden } of spaceChanges) {
      try {
        await updateSpacePerson({
          id: person.primaryProfile!.spaceId!,
          personId: person.primaryProfile!.id,
          sharedSpacePersonUpdateDto: { isHidden },
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    return { successCount, failCount };
  };

  const handleUpdate = (updatedVisibilityPeople: VisibilityPerson[]) => {
    const hiddenById = new Map(updatedVisibilityPeople.map((person) => [person.id, person.isHidden]));
    for (const person of people) {
      const nextHidden = hiddenById.get(person.id);
      if (nextHidden !== undefined && nextHidden !== person.isHidden) {
        person.isHidden = nextHidden;
      }
    }
    onUpdate(people);
  };
</script>

<PeopleVisibilityModal
  people={visibilityPeople}
  {totalPeopleCount}
  {titleId}
  {onClose}
  onUpdate={handleUpdate}
  {loadNextPage}
  hasMore={true}
  {saveVisibilityChanges}
/>
