import { eventManager } from '$lib/managers/event-manager.svelte';
import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
import PersonEditDescriptionModal from '$lib/modals/PersonEditDescriptionModal.svelte';
import PersonEditTypeModal from '$lib/modals/PersonEditTypeModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { updatePerson, updateSpacePerson, getPerson, type PersonResponseDto, type PersonUpdateDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiCalendarEditOutline,
  mdiTextBoxOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiHeartMinusOutline,
  mdiHeartOutline,
  mdiPaw,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

/**
 * Smart update — определяет по primaryProfile, какой API использовать:
 * - Space person → updateSpacePerson (space API)
 * - Regular person → updatePerson (person API)
 */
export const smartUpdatePerson = async (
  person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>,
  dto: Partial<PersonUpdateDto>,
): Promise<PersonResponseDto> => {
  const profile = person.primaryProfile;
  if (profile?.type === 'space-person' && profile.spaceId) {
    // Space person — используем space API для мутации
    await updateSpacePerson({
      id: profile.spaceId,
      personId: profile.id,
      sharedSpacePersonUpdateDto: dto,
    });
    // Перезагружаем полный PersonResponseDto через getPerson
    return getPerson({ id: person.id });
  }
  // Regular person
  return updatePerson({ id: person.id, personUpdateDto: dto as PersonUpdateDto });
};

export const getPersonActions = ($t: MessageFormatter, person: PersonResponseDto) => {
  const SetDateOfBirth: ActionItem = {
    title: $t('set_date_of_birth'),
    icon: mdiCalendarEditOutline,
    onAction: () => modalManager.show(PersonEditBirthDateModal, { person }),
  };

  const EditDescription: ActionItem = {
    title: $t('edit_person_description'),
    icon: mdiTextBoxOutline,
    onAction: () => modalManager.show(PersonEditDescriptionModal, { person }),
  };

  const EditType: ActionItem = {
    title: $t('edit_person_type'),
    icon: mdiPaw,
    $if: () => !person.primaryProfile || person.primaryProfile.type === 'user-person',
    onAction: () => modalManager.show(PersonEditTypeModal, { person }),
  };

  const Favorite: ActionItem = {
    title: $t('to_favorite'),
    icon: mdiHeartOutline,
    $if: () => !person.isFavorite,
    onAction: () => handleFavoritePerson(person),
  };

  const Unfavorite: ActionItem = {
    title: $t('unfavorite'),
    icon: mdiHeartMinusOutline,
    $if: () => !!person.isFavorite,
    onAction: () => handleUnfavoritePerson(person),
  };

  const HidePerson: ActionItem = {
    title: $t('hide_person'),
    icon: mdiEyeOffOutline,
    $if: () => !person.isHidden,
    onAction: () => handleHidePerson(person),
  };

  const ShowPerson: ActionItem = {
    title: $t('unhide_person'),
    icon: mdiEyeOutline,
    $if: () => !!person.isHidden,
    onAction: () => handleShowPerson(person),
  };

  return { SetDateOfBirth, EditDescription, EditType, Favorite, Unfavorite, HidePerson, ShowPerson };
};

const handleFavoritePerson = async (person: PersonResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { isFavorite: true });
    eventManager.emit('PersonUpdate', response);
    toastManager.primary($t('added_to_favorites'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: false } }));
  }
};

const handleUnfavoritePerson = async (person: PersonResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { isFavorite: false });
    eventManager.emit('PersonUpdate', response);
    toastManager.primary($t('removed_from_favorites'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: false } }));
  }
};

const handleHidePerson = async (person: PersonResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { isHidden: true });
    toastManager.primary($t('changed_visibility_successfully'));
    eventManager.emit('PersonUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.unable_to_hide_person'));
  }
};

const handleShowPerson = async (person: PersonResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { isHidden: false });
    toastManager.primary($t('changed_visibility_successfully'));
    eventManager.emit('PersonUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleUpdatePersonBirthDate = async (person: PersonResponseDto, birthDate: string) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { birthDate });
    toastManager.primary($t('date_of_birth_saved'));
    eventManager.emit('PersonUpdate', response);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_date_of_birth'));
  }
};

export const handleUpdatePersonType = async (
  person: PersonResponseDto,
  type: 'person' | 'pet',
  species: string | null,
) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { type, species });
    toastManager.primary($t('person_type_saved'));
    eventManager.emit('PersonUpdate', response);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_person_type'));
  }
};

export const handleUpdatePersonDescription = async (person: PersonResponseDto, description: string) => {
  const $t = await getFormatter();

  try {
    const response = await smartUpdatePerson(person, { description });
    toastManager.primary($t('person_description_saved'));
    eventManager.emit('PersonUpdate', response);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_person_description'));
  }
};
